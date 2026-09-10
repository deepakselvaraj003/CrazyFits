from django.db import transaction
from django.db.models import Count
import uuid, logging, os
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from apps.designs.models import Design
from apps.gallery.models import GalleryDesign
from .models import QuoteRequest, AdminNotification
from .serializers import *
from datetime import timedelta
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from common.pagination import TShirtPagination
from common.google_drive import delete_file_from_google_drive, download_file_from_google_drive
import zipfile
import io
from django.http import HttpResponse

logger = logging.getLogger(__name__)

def generate_unique_request_number():
    """Generate a collision-free request number with retry."""
    for _ in range(10):
        req_num = f"CF{uuid.uuid4().hex[:4].upper()}"
        if not QuoteRequest.objects.filter(request_number=req_num).exists():
            return req_num
    return f"CF{uuid.uuid4().hex[:4].upper()}"


class QuoteRequestAPIView(APIView):
    def get_permissions(self):

        if self.request.method == "POST":
            return [AllowAny()]

        return [IsAdminUser()]

    def get(self, request, request_id=None):

        if not request.user.is_superuser:
            return Response(
                {
                    "success": False,
                    "message": "Permission denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:

            if request_id:

                quote = QuoteRequest.objects.select_related("design","design__user","gallery_design").get(id=request_id)
                serializer = QuoteRequestSerializer(quote,context={"request": request})

                return Response(
                    {
                        "success": True,
                        "data": serializer.data
                    }
                )

            quotes = QuoteRequest.objects.select_related("design","gallery_design","design__user").all()
            paginator = TShirtPagination()
            page = paginator.paginate_queryset(quotes, request)

            if page is not None:
                serializer = QuoteRequestSerializer(page, many=True,context={"request": request})
                return paginator.get_paginated_response(serializer.data)

            serializer = QuoteRequestSerializer(quotes, many=True,context={"request": request})

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                }
            )

        except QuoteRequest.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Request not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("QuoteRequestAPIView get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve quote requests."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):

        serializer = CreateQuoteRequestSerializer(data=request.data)

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        design = None
        gallery_design = None

        if serializer.validated_data.get("design_id"):

            try:

                design = Design.objects.get(
                    id=serializer.validated_data["design_id"],
                    user=request.user
                )

            except Design.DoesNotExist:

                return Response(
                    {
                        "success": False,
                        "message": "Design not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        elif serializer.validated_data.get("gallery_design_id"):

            try:

                gallery_design = GalleryDesign.objects.get(
                    id=serializer.validated_data["gallery_design_id"],
                    is_active=True
                )

            except GalleryDesign.DoesNotExist:

                return Response(
                    {
                        "success": False,
                        "message": "Gallery design not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        else:

            return Response(
                {
                    "success": False,
                    "message": "Design id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if design:

            if design.is_submitted:

                return Response(
                    {
                        "success": False,
                        "message": "This design has already been submitted."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if QuoteRequest.objects.filter(design=design).exists():

                return Response(
                    {
                        "success": False,
                        "message": "Quote already submitted for this design."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:

            with transaction.atomic():

                size_breakdown = serializer.validated_data["size_breakdown"]

                quantity = sum(size_breakdown.values())

                quote = QuoteRequest.objects.create(

                    request_number=generate_unique_request_number(),

                    design=design,
                    gallery_design=gallery_design,

                    customer_name=serializer.validated_data["customer_name"],
                    email=serializer.validated_data["email"],
                    phone_number=serializer.validated_data["phone_number"],
                    quantity=quantity,
                    size_breakdown=size_breakdown,
                    notes=serializer.validated_data.get("notes")

                )

                if design:

                    design.is_submitted = True
                    design.save(update_fields=["is_submitted"])

                # Create admin notification record
                AdminNotification.objects.create(
                    quote_request=quote,
                    message=f"New quote request #{quote.request_number} received from {quote.customer_name or quote.email}"
                )

            # Trigger email notification to admin (fail-safe so request submission is never blocked)
            try:
                admin_email = (
                    os.getenv("ADMIN_NOTIFICATION_EMAIL")
                    or getattr(settings, "ADMIN_NOTIFICATION_EMAIL", None)
                    or getattr(settings, "DEFAULT_FROM_EMAIL", None)
                    or os.getenv("EMAIL_HOST_USER")
                )
                if admin_email:
                    design_name = (
                        quote.design.design_name
                        if quote.design
                        else (quote.gallery_design.design_name if quote.gallery_design else "Custom Design")
                    )
                    created_str = (
                        timezone.localtime(quote.created_at).strftime('%Y-%m-%d %H:%M:%S')
                        if quote.created_at
                        else timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                    )
                    send_mail(
                        subject=f"New Quote Request Received - {quote.request_number}",
                        message=(
                            f"Hello Admin,\n\n"
                            f"A new quote request has been received on CrazyFits.\n\n"
                            f"Request Number: {quote.request_number}\n"
                            f"Customer Name: {quote.customer_name or 'N/A'}\n"
                            f"Customer Email: {quote.email}\n"
                            f"Phone Number: {quote.phone_number}\n"
                            f"Quantity: {quote.quantity}\n"
                            f"Design: {design_name}\n"
                            f"Received At: {created_str}\n\n"
                            f"Please log in to the admin dashboard to review the request."
                        ),
                        from_email=None,
                        recipient_list=[admin_email],
                        fail_silently=True,
                    )
            except Exception as mail_err:
                logger.exception("Failed to send admin notification email for request %s: %s", quote.request_number, mail_err)

            return Response(
                {
                    "success": True,
                    "message": "Quote request submitted successfully.",
                    "data": QuoteRequestSerializer(quote,context={"request": request}).data
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.exception("QuoteRequestAPIView post error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to submit quote request. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def patch(self, request):

        if not request.user.is_superuser:

            return Response(
                {
                    "success": False,
                    "message": "Permission denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UpdateRequestStatusSerializer(data=request.data)
        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        request_ids = serializer.validated_data["request_ids"]
        status_value = serializer.validated_data["status"]
        requests = QuoteRequest.objects.select_related("design").filter(id__in=request_ids)

        if not requests.exists():

            return Response(
                {
                    "success": False,
                    "message": "Request(s) not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if status_value == "completed":
            for req in requests:
                design = req.design
                if design:
                    if design.front_png_files:
                        updated_front = []
                        for png in design.front_png_files:
                            try:
                                delete_file_from_google_drive(png.get("url"))
                            except Exception as e:
                                logger.warning("Error deleting front png %s: %s", png.get('name'), e)
                                updated_front.append(png)
                        if len(updated_front) != len(design.front_png_files):
                            design.front_png_files = updated_front
                            design.save(update_fields=["front_png_files"])

                    if design.back_png_files:
                        updated_back = []
                        for png in design.back_png_files:
                            try:
                                delete_file_from_google_drive(png.get("url"))
                            except Exception as e:
                                logger.warning("Error deleting back png %s: %s", png.get('name'), e)
                                updated_back.append(png)
                        if len(updated_back) != len(design.back_png_files):
                            design.back_png_files = updated_back
                            design.save(update_fields=["back_png_files"])

        updated_count = requests.update(
            status=status_value
        )

        return Response(
            {
                "success": True,
                "message": f"{updated_count} request(s) updated successfully."
            }
        )


class QuoteRequestFilterAPIView(APIView):
    
    permission_classes = [IsAdminUser]

    def post(self, request):
        
        if not request.user.is_superuser:
            return Response(
                {
                    "success": False,
                    "message": "Permission denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )
        try:

            serializer = QuoteRequestFilterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            queryset = QuoteRequest.objects.select_related(
                "design",
                "gallery_design",
                "design__user"
            )

            data = serializer.validated_data
            today = timezone.localdate()

            date_filter = data.get("date_filter")

            if date_filter == "today":

                queryset = queryset.filter(created_at__date=today)

            elif date_filter == "yesterday":

                queryset = queryset.filter(
                    created_at__date=today - timedelta(days=1)
                )

            elif date_filter == "this_week":

                start = today - timedelta(days=today.weekday())
                end = start + timedelta(days=6)

                queryset = queryset.filter(
                    created_at__date__range=(start, end)
                )

            elif date_filter == "last_week":

                this_week_start = today - timedelta(days=today.weekday())
                last_week_start = this_week_start - timedelta(days=7)
                last_week_end = this_week_start - timedelta(days=1)

                queryset = queryset.filter(
                    created_at__date__range=(
                        last_week_start,
                        last_week_end,
                    )
                )

            elif date_filter == "custom":

                queryset = queryset.filter(
                    created_at__date__range=(
                        data["start_date"],
                        data["end_date"],
                    )
                )

            search = data.get("search")

            if search:

                queryset = queryset.filter(
                    Q(request_number__icontains=search) |
                    Q(customer_name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phone_number__icontains=search) |
                    Q(design__design_name__icontains=search) |
                    Q(gallery_design__design_name__icontains=search)
                )

            queryset = queryset.order_by("-created_at")

            paginator = TShirtPagination()
            page = paginator.paginate_queryset(queryset, request)

            if page is not None:

                serializer = QuoteRequestSerializer(page, many=True, context={"request": request})

                return paginator.get_paginated_response(serializer.data)

            serializer = QuoteRequestSerializer(queryset, many=True, context={"request": request})

            return Response(
                {
                    "status": True,
                    "message": "Quote requests fetched successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except ValidationError as e:

            return Response(
                {
                    "status": False,
                    "message": "Validation failed.",
                    "errors": e.detail
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("QuoteRequestFilterAPIView error")
            return Response(
                {
                    "status": False,
                    "message": "Something went wrong while filtering quote requests."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
        
class DashboardAPIView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request):
        
        if not request.user.is_superuser:
            return Response(
                {
                    "success": False,
                    "message": "Permission denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            status_counts = (
                QuoteRequest.objects
                .values("status")
                .annotate(count=Count("id"))
            )

            data = {
                "total_requests": QuoteRequest.objects.count(),
                "pending_requests": 0,
                "contacted_requests": 0,
                "order_confirmed_requests": 0,
                "completed_requests": 0,
                "cancelled_requests": 0,
            }

            for item in status_counts:
                if item["status"] == "pending":
                    data["pending_requests"] = item["count"]

                elif item["status"] == "contacted":
                    data["contacted_requests"] = item["count"]

                elif item["status"] == "order_confirmed":
                    data["order_confirmed_requests"] = item["count"]

                elif item["status"] == "completed":
                    data["completed_requests"] = item["count"]

                elif item["status"] == "cancelled":
                    data["cancelled_requests"] = item["count"]

            return Response(
                {
                    "success": True,
                    "message": "Dashboard data fetched successfully.",
                    "data": data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception("DashboardAPIView error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to fetch dashboard data."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DownloadPNGsAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, request_id, side):
        if not request.user.is_superuser:
            return Response({"success": False, "message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            quote = QuoteRequest.objects.get(id=request_id)
        except QuoteRequest.DoesNotExist:
            return Response({"success": False, "message": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        if not quote.design:
            return Response({"success": False, "message": "No custom design found."}, status=status.HTTP_400_BAD_REQUEST)

        design = quote.design
        png_files = design.front_png_files if side == "front" else design.back_png_files

        if not png_files:
            return Response({"success": False, "message": f"No {side} PNGs available."}, status=status.HTTP_404_NOT_FOUND)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            seen_names = {}
            for png in png_files:
                original_name = png.get("name", "image.png")
                
                if original_name in seen_names:
                    seen_names[original_name] += 1
                    name_parts = original_name.rsplit(".", 1)
                    if len(name_parts) == 2:
                        safe_name = f"{name_parts[0]}_{seen_names[original_name]}.{name_parts[1]}"
                    else:
                        safe_name = f"{original_name}_{seen_names[original_name]}"
                else:
                    seen_names[original_name] = 0
                    safe_name = original_name

                file_id = png.get("file_id")
                try:
                    file_data, _ = download_file_from_google_drive(file_id)
                    zip_file.writestr(safe_name, file_data)
                except Exception as e:
                    logger.warning("Error downloading %s: %s", safe_name, e)

        zip_buffer.seek(0)
        customer_name = quote.customer_name.replace(" ", "_") if quote.customer_name else "Customer"
        filename = f"{customer_name}_{side}_pngs.zip"
        
        response = HttpResponse(zip_buffer.read(), content_type="application/zip")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class AdminNotificationAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        if not request.user.is_superuser:
            return Response(
                {"success": False, "message": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            notifications = AdminNotification.objects.select_related("quote_request").all()[:100]
            unread_count = AdminNotification.objects.filter(is_read=False).count()
            serializer = AdminNotificationSerializer(notifications, many=True)
            return Response(
                {
                    "success": True,
                    "unread_count": unread_count,
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.exception("AdminNotificationAPIView get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to fetch notifications."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, notification_id=None):
        if not request.user.is_superuser:
            return Response(
                {"success": False, "message": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            if not notification_id:
                return Response(
                    {"success": False, "message": "Notification id is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            notification = AdminNotification.objects.get(id=notification_id)
            notification.is_read = True
            notification.save(update_fields=["is_read"])
            return Response(
                {"success": True, "message": "Notification marked as read."},
                status=status.HTTP_200_OK
            )
        except AdminNotification.DoesNotExist:
            return Response(
                {"success": False, "message": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception("AdminNotificationAPIView patch error")
            return Response(
                {"success": False, "message": "Failed to update notification."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, notification_id=None):
        if not request.user.is_superuser:
            return Response(
                {"success": False, "message": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            if notification_id is not None:
                notification = AdminNotification.objects.get(id=notification_id)
                notification.delete()
                return Response(
                    {"success": True, "message": "Notification deleted successfully."},
                    status=status.HTTP_200_OK
                )
            else:
                AdminNotification.objects.all().delete()
                return Response(
                    {"success": True, "message": "All notifications deleted successfully."},
                    status=status.HTTP_200_OK
                )
        except AdminNotification.DoesNotExist:
            return Response(
                {"success": False, "message": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception("AdminNotificationAPIView delete error")
            return Response(
                {"success": False, "message": "Failed to delete notification(s)."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )