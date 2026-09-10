import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Star } from "lucide-react";
import { toast } from "react-hot-toast";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
    getPublicFeedbacks,
    createFeedback,
    updateFeedback,
} from "../../services/feedbackService";

// ─── Individual Review Card ───────────────────────────────────────────────────
const ReviewCard = ({ feedback }) => {
    const [expanded, setExpanded] = useState(false);
    const [reviewOverflows, setReviewOverflows] = useState(false);
    const [replyOverflows, setReplyOverflows] = useState(false);

    const reviewRef = useRef(null);
    const replyRef = useRef(null);

    // Detect real text overflow after mount / on font-load
    useEffect(() => {
        const checkOverflow = () => {
            if (reviewRef.current) {
                setReviewOverflows(
                    reviewRef.current.scrollHeight > reviewRef.current.clientHeight + 1
                );
            }
            if (replyRef.current) {
                setReplyOverflows(
                    replyRef.current.scrollHeight > replyRef.current.clientHeight + 1
                );
            }
        };

        checkOverflow();
        // Re-check when fonts finish loading
        if (document.fonts?.ready) {
            document.fonts.ready.then(checkOverflow);
        }
    }, [feedback]);

    const needsReadMore = reviewOverflows || replyOverflows;

    return (
        <div
            className={`group flex flex-col rounded-[24px] border border-border bg-surface p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl ${expanded ? "" : "feedback-card-collapsed"
                }`}
            style={expanded ? {} : { height: "340px" }}
        >
            {/* ── Stars ─────────────────────────────────────────────── */}
            <div className="flex gap-1 mb-4 flex-shrink-0">
                {[...Array(5)].map((_, index) => (
                    <Star
                        key={index}
                        className={`h-5 w-5 transition-all duration-200 ${index < feedback.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-border fill-transparent"
                            }`}
                    />
                ))}
            </div>

            {/* ── Review text ───────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <p
                    ref={reviewRef}
                    className={`text-sm leading-7 text-dark ${expanded ? "" : "line-clamp-4"
                        }`}
                >
                    {feedback.review}
                </p>
            </div>

            {/* ── Customer name & date ──────────────────────────────── */}
            <div className="flex-shrink-0 mt-4">
                <p className="text-lg font-bold text-dark font-heading leading-tight">
                    {feedback.customer_name}
                </p>
                <p className="mt-0.5 text-sm text-secondary">
                    {new Date(feedback.created_at).toLocaleDateString()}
                </p>
            </div>

            {/* ── Admin reply ───────────────────────────────────────── */}
            {feedback.admin_reply && (
                <div className="flex-shrink-0 mt-4 rounded-2xl border border-border bg-background p-4 overflow-hidden">
                    <h4 className="mb-2 text-xs font-bold text-primary">Admin Reply</h4>
                    <p
                        ref={replyRef}
                        className={`text-xs leading-6 text-secondary ${expanded ? "" : "line-clamp-3"
                            }`}
                    >
                        {feedback.admin_reply}
                    </p>
                </div>
            )}

            {/* ── Read More / Show Less ─────────────────────────────── */}
            {needsReadMore && (
                <button
                    className="flex-shrink-0 mt-3 text-primary hover:text-primary-hover text-xs font-bold hover:underline self-start cursor-pointer transition-colors duration-150"
                    onClick={() => setExpanded((prev) => !prev)}
                >
                    {expanded ? "Show Less" : "Read More"}
                </button>
            )}
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────

const FeedbackSection = () => {

    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");

    const [editingFeedback, setEditingFeedback] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { customer } = useAuth();

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {

        try {

            setLoading(true);

            const response = await getPublicFeedbacks();

            if (response.data.success) {
                setFeedbacks(response.data.data);
            }

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };


    const handleSubmit = async () => {

        if (rating === 0) {
            toast.error("Please select a rating.");
            return;
        }

        if (!review.trim()) {
            toast.error("Please enter your review.");
            return;
        }

        try {

            setSubmitting(true);

            const payload = {
                email: customer.email,
                rating,
                review,
            };

            if (editingFeedback) {

                await updateFeedback(
                    editingFeedback.id,
                    payload
                );
                toast.success("Feedback updated successfully!");

            } else {

                await createFeedback(payload);
                toast.success("Feedback submitted successfully!");

            }

            await fetchFeedbacks();

            setShowModal(false);
            setRating(0);
            setReview("");
            setEditingFeedback(null);

        } catch (error) {

            console.error(error);
            toast.error("Something went wrong. Please try again.");

        } finally {

            setSubmitting(false);

        }

    };

    return (

        <section id="feedback-section" className="bg-background py-24">
            <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">

                <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                    <div className="max-w-xl">

                        <h2 className="mb-3 text-3xl font-extrabold text-dark md:text-4xl lg:text-5xl font-heading">
                            Customer Reviews
                        </h2>

                        <p className="text-secondary leading-relaxed text-sm md:text-base">
                            See what our customers say about our custom T-shirt printing.
                        </p>

                    </div>

                    {
                        customer && (
                            <button
                                className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-hover text-surface font-semibold rounded-button shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer self-start sm:self-auto"
                                onClick={() => setShowModal(true)}
                            >
                                + Add Feedback
                            </button>
                        )
                    }

                </div>

                {
                    loading ? (

                        <div className="flex justify-center items-center py-12">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                        </div>

                    ) : feedbacks.length === 0 ? (

                        <p className="text-center text-secondary py-12">No feedback available.</p>

                    ) : (

                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            spaceBetween={25}
                            slidesPerView={3}
                            navigation
                            pagination={{ clickable: true }}
                            autoplay={{
                                delay: 4000,
                                disableOnInteraction: false,
                            }}
                            autoHeight={true}
                            loop={feedbacks.length > 3}
                            breakpoints={{
                                0: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 2,
                                },
                                1200: {
                                    slidesPerView: 3,
                                },
                            }}
                            className="feedback-swiper pb-14 px-10"
                        >


                            {

                                feedbacks.map((feedback) => (

                                    <SwiperSlide key={feedback.id}>

                                        <ReviewCard feedback={feedback} />

                                    </SwiperSlide>

                                ))

                            }

                        </Swiper>

                    )

                }
                {
                    showModal && (

                        <div
                            className="fixed inset-0 bg-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-300"
                            onClick={() => {
                                setShowModal(false);
                                setEditingFeedback(null);
                            }}
                        >

                            <div
                                className="w-full max-w-xl rounded-[28px] border border-border bg-surface p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >

                                <h3 className="text-2xl font-bold text-dark font-heading">
                                    {
                                        editingFeedback
                                            ? "Edit Feedback"
                                            : "Add Feedback"
                                    }
                                </h3>

                                <div className="flex gap-1.5 justify-center py-4 bg-background/50 rounded-xl border border-border">

                                    {

                                        [...Array(5)].map((_, index) => (

                                            <Star
                                                key={index}
                                                className={`w-8 h-8 cursor-pointer transition-all duration-150 ${index < rating
                                                        ? "text-yellow-500 fill-yellow-500 scale-110"
                                                        : "text-border hover:text-yellow-400"
                                                    }`}
                                                onClick={() => setRating(index + 1)}
                                            />

                                        ))

                                    }

                                </div>

                                <textarea
                                    rows="5"
                                    placeholder="Write your feedback..."
                                    className="w-full bg-background text-dark border border-border rounded-input p-4 text-sm font-body focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none placeholder-secondary"
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                />

                                <div className="flex justify-end gap-3 font-body">

                                    <button
                                        className="px-5 py-2.5 bg-background border border-border hover:bg-border/30 text-dark font-semibold rounded-button transition-colors duration-150 cursor-pointer"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingFeedback(null);
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-surface font-semibold rounded-button transition-colors duration-150 cursor-pointer"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >

                                        {
                                            submitting
                                                ? "Submitting..."
                                                : editingFeedback
                                                    ? "Update"
                                                    : "Submit"
                                        }

                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                }
            </div>
        </section>

    );

};

export default FeedbackSection;