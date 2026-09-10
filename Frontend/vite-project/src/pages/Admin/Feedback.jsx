import { useEffect, useState, useRef } from "react";
import { MdFilterList, MdSearch, MdStar, MdVisibility } from "react-icons/md";
import { toast } from "react-hot-toast";
import {
  editReply,
  filterFeedbacks,
  getFeedback,
  getFeedbacks,
  replyFeedback,
} from "../../services/feedbackService";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 font-body text-sm text-dark shadow-sm outline-none transition-colors placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20";
const scrollbarClass =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50";

function Stars({ rating }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <MdStar
          key={index}
          size={16}
          className={index < rating ? "text-warning" : "text-border"}
        />
      ))}
    </div>
  );
}

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1,
    page_size: 10,
    next: null,
    previous: null,
  });
  const setPageData = (data) => {
    setFeedbacks(data.data);
    setPagination({
      count: data.count,
      total_pages: data.total_pages,
      current_page: data.current_page,
      page_size: data.page_size,
      next: data.next,
      previous: data.previous,
    });
  };
  const fetchFeedbacks = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getFeedbacks(page);
      if (response.data.success) setPageData(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = async (selectedDateFilter = dateFilter) => {
    try {
      setLoading(true);
      const payload = {};
      if (search.trim()) payload.search = search.trim();
      if (selectedDateFilter) payload.date_filter = selectedDateFilter;
      if (selectedDateFilter === "custom") {
        payload.start_date = startDate;
        payload.end_date = endDate;
      }
      const response = await filterFeedbacks(payload);
      if (response.data.success) setPageData(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to filter feedback.");
    } finally {
      setLoading(false);
    }
  };
  const closePreview = () => {
    setShowPreview(false);
    setSelectedFeedback(null);
  };
  const handlePreview = async (id) => {
    try {
      setPreviewLoading(true);
      const response = await getFeedback(id);
      if (response.data.success) {
        setSelectedFeedback(response.data.data);
        setAdminReply(response.data.data.admin_reply || "");
        setShowPreview(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load feedback details.");
    } finally {
      setPreviewLoading(false);
    }
  };
  const handleReply = async () => {
    try {
      setReplyLoading(true);
      if (selectedFeedback.admin_reply)
        await editReply({ id: selectedFeedback.id, admin_reply: adminReply });
      else
        await replyFeedback({
          id: selectedFeedback.id,
          admin_reply: adminReply,
        });
      const response = await getFeedback(selectedFeedback.id);
      if (response.data.success) {
        setSelectedFeedback(response.data.data);
        setAdminReply(response.data.data.admin_reply || "");
      }
      toast.success("Reply saved successfully.");
      fetchFeedbacks(pagination.current_page);
    } catch (error) {
      console.error(error);
      toast.error("Unable to save reply.");
    } finally {
      setReplyLoading(false);
    }
  };
  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (search.trim() || dateFilter) handleSearch();
      else fetchFeedbacks();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && showPreview) closePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPreview]);
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden text-dark bg-background">
      <div className="mb-4 shrink-0">
        <h1 className="m-0 font-heading text-2xl font-bold tracking-tight text-dark">
          Feedback Management
        </h1>
      </div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 shrink-0 lg:flex-row lg:items-start">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-1">
          <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 shadow-sm sm:max-w-sm">
            <MdSearch size={20} className="shrink-0 text-secondary" />
            <input
              type="text"
              placeholder="Search by email, quote no..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full border-none bg-transparent p-0 font-body text-sm text-dark outline-none placeholder:text-secondary focus:ring-0"
            />
          </div>
          <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 shadow-sm sm:w-52">
            <MdFilterList size={20} className="shrink-0 text-secondary" />
            <select
              value={dateFilter}
              onChange={(event) => {
                const value = event.target.value;
                setDateFilter(value);
                if (value !== "custom")
                  setTimeout(() => handleSearch(value), 0);
              }}
              className="w-full border-none bg-transparent p-0 font-body text-sm text-dark outline-none focus:ring-0"
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {dateFilter === "custom" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={`${inputClass} sm:w-40`}
              />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={`${inputClass} sm:w-40`}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSearch}
                className="h-10 rounded-xl px-4 font-heading"
              >
                Apply Filter
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-sm">
        <div className={`flex-1 overflow-auto ${scrollbarClass}`}>
          <table className="w-full border-separate border-spacing-0 text-sm table-auto">
            <thead className="sticky top-0 z-10 bg-background text-left font-heading text-xs uppercase tracking-[0.2em] text-secondary">
              <tr>
                {[
                  "Customer Name",
                  "Customer Email",
                  "Rating",
                  "Review",
                  "Status",
                  "Posted Date",
                  "Action",
                ].map((heading, index) => (
                  <th
                    key={heading}
                    className={`border-b border-border px-4 py-3.5 whitespace-nowrap ${index === 1 ? "hidden md:table-cell" : ""} ${index === 5 ? "hidden lg:table-cell" : ""} ${index === 6 ? "text-right" : ""}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-3 w-24 rounded bg-border/60" />
                    </td>
                    <td className="hidden px-4 py-4 md:table-cell">
                      <div className="h-3 w-32 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-20 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-36 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-16 rounded bg-border/60" />
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      <div className="h-3 w-20 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="ml-auto h-8 w-8 rounded bg-border/60" />
                    </td>
                  </tr>
                ))
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="font-heading text-lg font-bold text-dark">
                      No feedback found
                    </p>
                    <p className="mt-2 font-body text-sm text-secondary">
                      Try a different search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr
                    key={feedback.id}
                    className="transition-colors duration-200 hover:bg-background/45"
                  >
                    <td className="border-b border-border px-4 py-3 font-heading font-semibold text-dark whitespace-nowrap">
                      {feedback.customer_name}
                    </td>
                    <td className="hidden border-b border-border px-4 py-3 font-body text-secondary md:table-cell">
                      {feedback.customer_email}
                    </td>
                    <td className="border-b border-border px-4 py-3">
                      <Stars rating={feedback.rating} />
                    </td>
                    <td className="max-w-[240px] truncate border-b border-border px-4 py-3 font-body text-secondary">
                      {feedback.review}
                    </td>
                    <td className="border-b border-border px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 font-heading text-[11px] font-medium ${feedback.admin_reply ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}
                      >
                        {feedback.admin_reply ? "Replied" : "Pending"}
                      </span>
                    </td>
                    <td className="hidden border-b border-border px-4 py-3 font-body text-secondary whitespace-nowrap lg:table-cell">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </td>
                    <td className="border-b border-border px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePreview(feedback.id)}
                        title="Preview feedback"
                        className="h-8 w-8 rounded-full p-0"
                      >
                        <MdVisibility size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && pagination.total_pages > 1 && (
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-4 py-3 sm:px-6">
            <p className="font-body text-sm text-secondary">
              Page {pagination.current_page} of {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!pagination.previous}
                onClick={() => fetchFeedbacks(pagination.current_page - 1)}
                className="h-8 rounded-lg px-4 font-heading text-xs"
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!pagination.next}
                onClick={() => fetchFeedbacks(pagination.current_page + 1)}
                className="h-8 rounded-lg px-4 font-heading text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      <Modal
        isOpen={showPreview}
        onClose={closePreview}
        title="Feedback Details"
        width="600px"
      >
        {previewLoading ? (
          <div className="py-10 text-center font-body text-sm text-secondary">
            Loading feedback details
          </div>
        ) : (
          selectedFeedback && (
            <div className="space-y-5">
              <div className="grid gap-3 font-body text-sm text-secondary sm:grid-cols-2">
                <p>
                  <span className="font-heading font-semibold text-dark">
                    Name:
                  </span>{" "}
                  {selectedFeedback.customer_name}
                </p>
                <p>
                  <span className="font-heading font-semibold text-dark">
                    Email:
                  </span>{" "}
                  {selectedFeedback.customer_email}
                </p>
              </div>
              <div>
                <p className="mb-2 font-heading text-sm font-semibold text-dark">
                  Rating
                </p>
                <Stars rating={selectedFeedback.rating} />
              </div>
              <div>
                <p className="mb-2 font-heading text-sm font-semibold text-dark">
                  Review
                </p>
                <div className="rounded-xl border border-border bg-background p-4 font-body text-sm leading-6 text-dark">
                  {selectedFeedback.review}
                </div>
              </div>
              <div>
                <label
                  htmlFor="admin-reply"
                  className="mb-2 block font-heading text-sm font-semibold text-dark"
                >
                  Admin Reply
                </label>
                <textarea
                  id="admin-reply"
                  rows={5}
                  value={adminReply}
                  onChange={(event) => setAdminReply(event.target.value)}
                  placeholder="Write a reply"
                  className="w-full resize-y rounded-xl border border-border bg-surface p-4 font-body text-sm text-dark shadow-sm outline-none placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closePreview}
                  className="h-10 rounded-xl px-4 font-heading"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleReply}
                  isLoading={replyLoading}
                  className="h-10 rounded-xl px-4 font-heading"
                >
                  {selectedFeedback.admin_reply ? "Update Reply" : "Reply"}
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
export default Feedback;
