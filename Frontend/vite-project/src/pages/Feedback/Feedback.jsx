import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    getPublicFeedbacks,
    createFeedback,
    updateFeedback,
} from "../../services/feedbackService";
import { useAuth } from "../../context/AuthContext";

export default function Feedback() {

    const { customer } = useAuth();

    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState(null);

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [expandedReview, setExpandedReview] = useState({});
    const [expandedReply, setExpandedReply] = useState({});
    useEffect(() => {
        fetchMyFeedbacks();
    }, []);

    const fetchMyFeedbacks = async () => {
        try {
            setLoading(true);

            const response = await getPublicFeedbacks();
            const myFeedbacks = response.data.data.filter(
                (item) => item.customer_email === customer.email
            );

            setFeedbacks(myFeedbacks);
        } catch (err) {
            toast.error("Unable to load feedback. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {

        setEditingFeedback(null);
        setRating(0);
        setReview("");
        setShowModal(true);

    };

    const handleEdit = (feedback) => {

        setEditingFeedback(feedback);
        setRating(feedback.rating);
        setReview(feedback.review);
        setShowModal(true);

    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.warning("Please select rating.");
            return;
        }

        if (!review.trim()) {
            toast.warning("Please enter review.");
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
                await updateFeedback(editingFeedback.id, payload);
                toast.success("Feedback updated successfully.");
            } else {
                await createFeedback(payload);
                toast.success("Feedback submitted successfully.");
            }

            await fetchMyFeedbacks();
            setShowModal(false);
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 py-10 text-dark font-body sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-10 rounded-[28px] border border-border bg-surface p-6 shadow-sm shadow-primary/5 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold tracking-tight text-dark font-heading sm:text-5xl">
                            My Feedback
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-secondary sm:text-base">
                            Manage your submitted reviews, see responses, and update ratings from here.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="mt-4 inline-flex items-center justify-center rounded-[18px] bg-dark px-5 py-3 text-sm font-semibold text-surface transition hover:bg-dark/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:mt-0"
                    >
                        + Add Feedback
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-[28px] border border-border bg-surface p-10 text-center shadow-sm">
                        <p className="text-base font-semibold text-dark">Loading feedback...</p>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="rounded-[28px] border border-border bg-surface p-10 text-center shadow-sm">
                        <p className="text-lg font-semibold text-dark">No feedback submitted yet</p>
                        <p className="mt-3 text-sm leading-7 text-secondary">
                            Submit your first review to keep track of your experience.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {feedbacks.map((feedback) => {
                            const isReviewExpanded = expandedReview[feedback.id];
                            const isReplyExpanded = expandedReply[feedback.id];
                            const reviewHasMore = feedback.review.length > 180;
                            const replyHasMore = feedback.admin_reply?.length > 180;

                            return (
                                <div
                                    key={feedback.id}
                                    className="flex h-full flex-col rounded-[28px] border border-border bg-surface p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-2 text-lg">
                                        {[...Array(5)].map((_, index) => (
                                            <span
                                                key={index}
                                                className={
                                                    index < feedback.rating
                                                        ? "text-yellow-400"
                                                        : "text-secondary/60"
                                                }
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex-1">
                                        <div className="rounded-[20px] border border-border bg-background p-4 text-sm leading-7 text-secondary">
                                            <p className={`whitespace-pre-wrap break-words ${isReviewExpanded ? "max-h-full" : "max-h-[140px] overflow-hidden"}`}>
                                                {feedback.review}
                                            </p>
                                        </div>

                                        {reviewHasMore && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedReview((prev) => ({
                                                        ...prev,
                                                        [feedback.id]: !prev[feedback.id],
                                                    }))
                                                }
                                                className="mt-3 text-sm font-semibold text-primary transition hover:text-primary-hover"
                                            >
                                                {isReviewExpanded ? "Read Less" : "Read More"}
                                            </button>
                                        )}
                                    </div>

                                    <p className="mt-6 text-xs uppercase tracking-[0.24em] text-secondary/70">
                                        {new Date(feedback.created_at).toLocaleDateString()}
                                    </p>

                                    {feedback.admin_reply && (
                                        <div className="mt-5 rounded-[22px] border border-border bg-background p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.10em] text-primary">Admin Reply</p>
                                            <p className={`mt-3 text-sm leading-7 text-secondary ${isReplyExpanded ? "max-h-full" : "max-h-[120px] overflow-hidden"}`}>
                                                {feedback.admin_reply}
                                            </p>
                                            {replyHasMore && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedReply((prev) => ({
                                                            ...prev,
                                                            [feedback.id]: !prev[feedback.id],
                                                        }))
                                                    }
                                                    className="mt-3 text-sm font-semibold text-primary transition hover:text-primary-hover"
                                                >
                                                    {isReplyExpanded ? "Read Less" : "Read More"}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!feedback.admin_reply && (
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(feedback)}
                                            className="mt-6 inline-flex items-center justify-center rounded-[18px] bg-dark px-4 py-3 text-sm font-semibold text-surface transition hover:bg-dark/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-dark/40 px-4 py-6 backdrop-blur-sm">
                    <div
                        className="w-full max-w-xl rounded-[28px] border border-border bg-background p-6 shadow-2xl sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold text-dark font-heading">
                                {editingFeedback ? "Edit Feedback" : "Add Feedback"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-full border border-border bg-surface p-3 text-secondary transition hover:border-primary hover:text-dark"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex gap-2 text-2xl">
                            {[...Array(5)].map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setRating(index + 1)}
                                    className={
                                        index < rating
                                            ? "text-yellow-400"
                                            : "text-secondary/60"
                                    }
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea
                            rows={5}
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Write your feedback..."
                            className="mt-6 w-full rounded-[18px] border border-border bg-surface px-4 py-4 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background"
                        />

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="inline-flex w-full items-center justify-center rounded-[18px] border border-border bg-background px-4 py-3 text-sm font-semibold text-dark transition hover:bg-surface sm:w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="inline-flex w-full items-center justify-center rounded-[18px] bg-dark px-4 py-3 text-sm font-semibold text-surface transition hover:bg-dark/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                {submitting ? "Saving..." : editingFeedback ? "Update" : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}