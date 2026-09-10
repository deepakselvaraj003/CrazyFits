from django.db import transaction
from django.db.models import Q
import logging
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from .models import Feedback
from rest_framework.exceptions import ValidationError
from .serializers import FeedbackSerializer,AdminFeedbackSerializer,FeedbackFilterSerializer
from apps.requests_app.models import QuoteRequest
from common.pagination import TShirtPagination

logger = logging.getLogger(__name__)

class UserFeedbackAPIView(APIView):

    def get_permissions(self):

        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get(self, request, id=None):

        try:

            if id:

                feedback = Feedback.objects.select_related(
                    "user"
                ).get(id=id)

                serializer = FeedbackSerializer(feedback)

                return Response(
                    {
                        "success": True,
                        "data": serializer.data
                    },
                    status=status.HTTP_200_OK
                )

            feedbacks = Feedback.objects.select_related(
                "user"
            ).order_by("-created_at")

            serializer = FeedbackSerializer(
                feedbacks,
                many=True
            )

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Feedback.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Feedback not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("UserFeedbackAPIView get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve feedback."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):

        serializer = FeedbackSerializer(data=request.data)

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            quote = QuoteRequest.objects.filter(
                email=request.user.email
            ).first()

            if not quote:

                return Response(
                    {
                        "success": False,
                        "message": "You can submit feedback only after requesting a quote."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            with transaction.atomic():

                feedback = Feedback.objects.create(
                    user=request.user,
                    rating=serializer.validated_data["rating"],
                    review=serializer.validated_data["review"]
                )

            return Response(
                {
                    "success": True,
                    "message": "Feedback submitted successfully.",
                    "data": FeedbackSerializer(feedback).data
                },
                status=status.HTTP_201_CREATED
            )


        except Exception as e:
            logger.exception("UserFeedbackAPIView post error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to submit feedback. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, id=None):

        if not id:

            return Response(
                {
                    "success": False,
                    "message": "Feedback id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            feedback = Feedback.objects.get(
                id=id,
                user=request.user
            )

            if feedback.admin_reply:

                return Response(
                    {
                        "success": False,
                        "message": "Feedback cannot be edited after admin reply."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = FeedbackSerializer(
                feedback,
                data=request.data,
                partial=True
            )

            if not serializer.is_valid():

                return Response(
                    {
                        "success": False,
                        "errors": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Feedback updated successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Feedback.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Feedback not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("UserFeedbackAPIView patch error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to update feedback. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminFeedbackAPIView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request, id=None):

        if not request.user.is_superuser:

            return Response(
                {
                    "success": False,
                    "message": "Permission denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:

            if id:

                feedback = Feedback.objects.select_related(
                    "user"
                ).get(id=id)

                serializer = AdminFeedbackSerializer(feedback)

                return Response(
                    {
                        "success": True,
                        "data": serializer.data
                    },
                    status=status.HTTP_200_OK
                )
        
            queryset = Feedback.objects.select_related(
                "user"
            ).order_by("-created_at")


            paginator = TShirtPagination()
            page = paginator.paginate_queryset(queryset, request)

            if page is not None:

                serializer = AdminFeedbackSerializer(
                    page,
                    many=True
                )

                return paginator.get_paginated_response(serializer.data)

            serializer = AdminFeedbackSerializer(
                queryset,
                many=True
            )

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Feedback.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Feedback not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("AdminFeedbackAPIView get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve feedback list."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

            id = request.data.get("id")
            admin_reply = request.data.get("admin_reply")

            if not id:

                return Response(
                    {
                        "success": False,
                        "message": "Feedback id is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not admin_reply:

                return Response(
                    {
                        "success": False,
                        "message": "Admin reply is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            feedback = Feedback.objects.get(id=id)

            if feedback.admin_reply:

                return Response(
                    {
                        "success": False,
                        "message": "Admin reply already exists."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():

                feedback.admin_reply = admin_reply
                feedback.admin_replied_at = timezone.now()
                feedback.save(
                    update_fields=[
                        "admin_reply",
                        "admin_replied_at"
                    ]
                )

            return Response(
                {
                    "success": True,
                    "message": "Reply added successfully.",
                    "data": AdminFeedbackSerializer(feedback).data
                },
                status=status.HTTP_200_OK
            )

        except Feedback.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Feedback not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("AdminFeedbackAPIView post error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to add reply."
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

        try:

            id = request.data.get("id")
            admin_reply = request.data.get("admin_reply")

            if not id:

                return Response(
                    {
                        "success": False,
                        "message": "Feedback id is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not admin_reply:

                return Response(
                    {
                        "success": False,
                        "message": "Admin reply is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            feedback = Feedback.objects.get(id=id)

            if not feedback.admin_reply:

                return Response(
                    {
                        "success": False,
                        "message": "Admin reply not found."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():

                feedback.admin_reply = admin_reply
                feedback.admin_replied_at = timezone.now()
                feedback.save(
                    update_fields=[
                        "admin_reply",
                        "admin_replied_at"
                    ]
                )

            return Response(
                {
                    "success": True,
                    "message": "Reply updated successfully.",
                    "data": AdminFeedbackSerializer(feedback).data
                },
                status=status.HTTP_200_OK
            )

        except Feedback.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Feedback not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("AdminFeedbackAPIView patch error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to update reply."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FeedbackFilterAPIView(APIView):

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

            serializer = FeedbackFilterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            queryset = Feedback.objects.select_related(
                "user"
            )

            data = serializer.validated_data
            today = timezone.localdate()

            date_filter = data.get("date_filter")

            if date_filter == "today":

                queryset = queryset.filter(
                    created_at__date=today
                )

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
                        last_week_end
                    )
                )

            elif date_filter == "custom":

                queryset = queryset.filter(
                    created_at__date__range=(
                        data["start_date"],
                        data["end_date"]
                    )
                )

            search = data.get("search")

            if search:

                queryset = queryset.filter(
                    Q(user__email__icontains=search) |
                    Q(review__icontains=search) |
                    Q(admin_reply__icontains=search)
                )

            queryset = queryset.order_by("-created_at")

            paginator = TShirtPagination()
            page = paginator.paginate_queryset(queryset, request)

            if page is not None:

                serializer = AdminFeedbackSerializer(
                    page,
                    many=True
                )

                return paginator.get_paginated_response(
                    serializer.data
                )

            serializer = AdminFeedbackSerializer(
                queryset,
                many=True
            )

            return Response(
                {
                    "success": True,
                    "message": "Feedbacks fetched successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except ValidationError as e:

            return Response(
                {
                    "success": False,
                    "message": "Validation failed.",
                    "errors": e.detail
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("FeedbackFilterAPIView error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to filter feedbacks."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
