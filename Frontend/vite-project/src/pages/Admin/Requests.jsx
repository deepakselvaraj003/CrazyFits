import { useEffect, useState, useRef } from "react";
import {
  MdSearch,
  MdVisibility,
  MdDownload,
  MdFilterList,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
} from "react-icons/md";
import { toast } from "react-hot-toast";
import {
  getRequests,
  filterRequests,
  updateRequestStatus,
  downloadPNGs
} from "../../services/requestService";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import AuthenticatedImage from "../../components/AuthenticatedImage/AuthenticatedImage";
import {
  getAuthenticatedImageBlobUrl,
  downloadAuthenticatedImage,
} from "../../components/AuthenticatedImage/privateImageLoader";

const STATUS_CLASSES = {
  pending: "bg-warning/10 text-warning border-warning/30",
  contacted: "bg-primary/10 text-primary border-primary/30",
  order_confirmed: "bg-success/10 text-success border-success/30",
  completed: "bg-success/20 text-success border-success/40",
  cancelled: "bg-danger/10 text-danger border-danger/30",
};

function StatusBadge({ status }) {
  const statusKey = status || "";

  const formattedStatus = statusKey
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const badgeClass =
    STATUS_CLASSES[statusKey] ??
    "bg-surface text-secondary border-border";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-normal ${badgeClass}`}
    >
      {formattedStatus}
    </span>
  );
}

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [statusValue, setStatusValue] = useState("");
  const [updating, setUpdating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [completionConfirmOpen, setCompletionConfirmOpen] = useState(false);

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchRequests(1, "", "");
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  async function fetchRequests(page = 1, currentSearch = search, currentDateFilter = dateFilter) {
    try {
      setLoading(true);
      const payload = {};
      if (currentSearch) payload.search = currentSearch;
      if (currentDateFilter) payload.date_filter = currentDateFilter;
      if (currentDateFilter === "custom" && startDate && endDate) {
        payload.start_date = startDate;
        payload.end_date = endDate;
      }

      const hasFilters = payload.search || payload.date_filter;
      const res = hasFilters
        ? await filterRequests(payload, page)
        : await getRequests(page);

      setRequests(res.data.data);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      toast.error("Unable to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value) {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchRequests(1, value, dateFilter);
    }, 400);
  }

  async function handleDateFilter(value) {
    setDateFilter(value);
    if (value === "custom") {
      return;
    }
    fetchRequests(1, search, value);
  }

  async function handleCustomFilter() {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    fetchRequests(1, search, "custom");
  }

  async function downloadImage(url, filename) {
    try {
      await downloadAuthenticatedImage(url, filename);
    } catch (err) {
      toast.error("Download failed. Please try again.");
    }
  }

  async function openPreview(item) {
    setPreviewData(item);
    setPreviewOpen(true);
    setPreviewLoading(true);

    const preload = async (src) => {
      if (!src) return;
      if (src.includes("/media/proxy/")) {
        try {
          await getAuthenticatedImageBlobUrl(src);
        } catch (_) {
          // Handled gracefully by component
        }
      } else {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = src;
        });
      }
    };

    await Promise.all([
      preload(item.front_preview),
      preload(item.back_preview),
      preload(item.preview_image),
      preload(item.gallery_back_preview),
    ]);

    setPreviewLoading(false);
  }

  function handleSelect(id) {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleSelectAll(e) {
    setSelectedRows(e.target.checked ? requests.map((r) => r.id) : []);
  }

  async function handleStatusUpdate() {
    if (!selectedRows.length || !statusValue) {
      return;
    }

    if (statusValue === "completed") {
      setCompletionConfirmOpen(true);
      return;
    }

    await executeStatusUpdate();
  }

  async function executeStatusUpdate() {
    try {
      setUpdating(true);
      await updateRequestStatus({ request_ids: selectedRows, status: statusValue });
      setSelectedRows([]);
      setStatusValue("");
      toast.success("Status updated successfully.");
      fetchRequests(currentPage);
    } catch (err) {
      toast.error("Unable to update status. Please try again.");
    } finally {
      setUpdating(false);
      setCompletionConfirmOpen(false);
    }
  }

  const handleDownloadPNGs = async (requestId, side) => {
    try {
        toast.loading("Zipping files...", { id: "download-zip" });
        const res = await downloadPNGs(requestId, side);
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Quote_${requestId}_${side}_pngs.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Downloaded successfully", { id: "download-zip" });
    } catch (err) {
        console.error(err);
        toast.error("Failed to download PNGs.", { id: "download-zip" });
    }
  };

  const allSelected = requests.length > 0 && selectedRows.length === requests.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden text-dark bg-background">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-dark font-heading m-0">Quote Requests</h1>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start justify-between shrink-0">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm h-10 w-full">
            <MdSearch size={20} className="text-secondary shrink-0" />
            <input
              type="text"
              placeholder="Search here"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-dark outline-none placeholder:text-secondary border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-52 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm h-10 w-full">
            <MdFilterList size={20} className="text-secondary shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilter(e.target.value)}
              className="w-full bg-transparent text-sm text-dark outline-none border-none p-0 focus:ring-0 cursor-pointer"
            >
              <option value="" className="bg-surface text-dark">All Dates</option>
              <option value="today" className="bg-surface text-dark">Today</option>
              <option value="yesterday" className="bg-surface text-dark">Yesterday</option>
              <option value="this_week" className="bg-surface text-dark">This Week</option>
              <option value="last_week" className="bg-surface text-dark">Last Week</option>
              <option value="custom" className="bg-surface text-dark">Custom Range</option>
            </select>
          </div>

          {dateFilter === "custom" && (
            <div className="flex flex-col gap-2 mt-1 animate-fade-in w-full">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-10 w-full"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-10 w-full"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCustomFilter}
                className="w-full rounded-xl text-sm font-semibold h-10"
              >
                Apply Range
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 shadow-sm w-full sm:w-64 h-10 shrink-0">
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="w-full bg-transparent text-sm text-dark outline-none border-none p-0 focus:ring-0 cursor-pointer"
          >
            <option value="" className="bg-surface text-dark">Update Status</option>
            <option value="pending" className="bg-surface text-dark">Pending</option>
            <option value="contacted" className="bg-surface text-dark">Contacted</option>
            <option value="order_confirmed" className="bg-surface text-dark">Order Confirmed</option>
            <option value="completed" className="bg-surface text-dark">Completed</option>
            <option value="cancelled" className="bg-surface text-dark">Cancelled</option>
          </select>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleStatusUpdate}
            isLoading={updating}
            disabled={!statusValue || updating}
            className="shrink-0 px-4 py-1 text-xs font-semibold rounded-lg h-7"
          >
            Apply
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-[18px] border border-border bg-surface flex flex-col overflow-hidden w-full max-w-full shadow-sm">
        <div className="flex-1 overflow-auto w-full max-w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full border-separate border-spacing-0 text-sm table-auto">
            <thead className="bg-background text-left text-xs uppercase tracking-[0.2em] text-secondary sticky top-0 z-10">
              <tr>
                <th className="border-b border-border px-4 py-3.5 w-14 text-center whitespace-nowrap">
                  <label className="inline-flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-border bg-surface text-primary outline-none focus:ring-primary cursor-pointer"
                    />
                  </label>
                </th>
                <th className="border-b border-border px-4 py-3.5 min-w-[100px] whitespace-nowrap">Request ID</th>
                <th className="border-b border-border px-4 py-3.5 min-w-[150px] whitespace-nowrap">Design</th>
                <th className="border-b border-border px-4 py-3.5 min-w-[150px] whitespace-nowrap">Customer</th>
                <th className="border-b border-border px-4 py-3.5 min-w-[200px] whitespace-nowrap hidden md:table-cell">Email</th>
                <th className="border-b border-border px-4 py-3.5 min-w-[130px] whitespace-nowrap hidden xl:table-cell">Phone</th>
                <th className="border-b border-border px-4 py-3.5 min-w-[60px] whitespace-nowrap">Qty</th>
                <th className="border-b border-border px-4 py-3.5 min-w-[120px] whitespace-nowrap">Status</th>
                <th className="border-b border-border px-4 py-3.5 min-w-[100px] whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-surface">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b border-border">
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto h-4 w-4 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-16 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-24 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-20 rounded bg-border/60" />
                    </td>
                    <td className="hidden md:table-cell px-4 py-4">
                      <div className="h-3 w-28 rounded bg-border/60" />
                    </td>
                    <td className="hidden xl:table-cell px-4 py-4">
                      <div className="h-3 w-20 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-8 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-16 rounded bg-border/60" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-16 rounded bg-border/60 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-secondary">
                    <p className="text-lg font-bold text-dark font-heading">No requests found</p>
                    <p className="mt-2 text-sm">
                      Try a different search or filter, or refresh the page to load the latest requests.
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-border last:border-b-0 transition-colors duration-200 ${
                      selectedRows.includes(item.id) ? "bg-primary/10" : "hover:bg-background/45"
                    }`}
                  >
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-dark transition-colors duration-200 hover:border-primary cursor-pointer"
                        aria-label="Select request"
                      >
                        {selectedRows.includes(item.id) ? (
                          <MdCheckBox size={18} className="text-primary" />
                        ) : (
                          <MdCheckBoxOutlineBlank size={18} className="text-secondary" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-background px-2.5 py-0.5 text-xs font-bold text-primary">
                        {item.request_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark truncate max-w-[200px] whitespace-nowrap">
                      {item.design_name}
                    </td>
                    <td className="px-4 py-3 text-dark truncate max-w-[150px] whitespace-nowrap">
                      {item.customer_name}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-secondary truncate max-w-[200px] whitespace-nowrap">
                      {item.email}
                    </td>
                    <td className="hidden xl:table-cell px-4 py-3 text-secondary truncate max-w-[130px] whitespace-nowrap">
                      {item.phone_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap ">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-7 py-3 text-right whitespace-nowrap">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0"
                        onClick={() => openPreview(item)}
                        title="Preview"
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

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-surface px-6 py-4 shrink-0">
            <p className="text-sm text-secondary">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchRequests(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg"
              >
                ← Prev
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchRequests(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg"
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {previewOpen && previewData && (
        <Modal
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewData(null);
            setPreviewLoading(false);
          }}
          title={`Request ${previewData.request_number}`}
          width="900px"
        >
          <div className="relative max-h-[55vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            {previewLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-background/80">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2 text-dark">
              <div className="space-y-4">
                {previewData.design_type === "gallery" ? (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-border bg-surface p-3.5 shadow-sm flex flex-col">
                      <p className="mb-2 text-xs font-bold text-secondary uppercase tracking-wider">
                        {previewData.gallery_back_preview ? "Front Preview" : "Gallery Preview"}
                      </p>
                      <div className="aspect-[16/10] max-h-52 overflow-hidden rounded-xl bg-background flex items-center justify-center border border-border">
                        <img
                          src={previewData.preview_image}
                          alt="Gallery Front Design"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          downloadImage(
                            previewData.preview_image,
                            `${previewData.request_number}_${previewData.customer_name}_Front.png`
                          )
                        }
                        className="mt-2.5 inline-flex h-8 w-fit self-center items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-medium"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <MdDownload size={14} className="shrink-0" />
                          <span>{previewData.gallery_back_preview ? "Download Front" : "Download Design"}</span>
                        </span>
                      </Button>
                    </div>

                    {previewData.gallery_back_preview && (
                      <div className="rounded-xl border border-border bg-surface p-3.5 shadow-sm flex flex-col">
                        <p className="mb-2 text-xs font-bold text-secondary uppercase tracking-wider">Back Preview</p>
                        <div className="aspect-[16/10] max-h-52 overflow-hidden rounded-xl bg-background flex items-center justify-center border border-border">
                          <img
                            src={previewData.gallery_back_preview}
                            alt="Gallery Back Design"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            downloadImage(
                              previewData.gallery_back_preview,
                              `${previewData.request_number}_${previewData.customer_name}_Back.png`
                            )
                          }
                          className="mt-2.5 inline-flex h-8 w-fit self-center items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-medium"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <MdDownload size={14} className="shrink-0" />
                            <span>Download Back</span>
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {[
                      ["front_preview", "Front Preview", "front"],
                      ["back_preview", "Back Preview", "back"],
                    ].map(([key, label, side]) =>
                      previewData[key] ? (
                        <div key={key} className="rounded-xl border border-border bg-surface p-3.5 shadow-sm flex flex-col">
                          <p className="mb-2 text-xs font-bold text-secondary uppercase tracking-wider">{label}</p>
                          <div className="aspect-[16/10] max-h-52 overflow-hidden rounded-xl border border-border bg-background flex items-center justify-center">
                            <AuthenticatedImage
                              src={previewData[key]}
                              alt={label}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex justify-center gap-2 mt-2.5">
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  downloadImage(
                                    previewData[key],
                                    `${previewData.request_number}_${previewData.customer_name}_${label}.png`
                                  )
                                }
                                className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-medium"
                              >
                                <span className="inline-flex items-center gap-1 h-8">
                                  <MdDownload size={14} className="shrink-0" />
                                  <span>Download {label.split(' ')[0]}</span>
                                </span>
                              </Button>
                              {previewData[`has_${side}_pngs`] && (
                                  <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleDownloadPNGs(previewData.id, side)}
                                      className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-medium border border-primary/20 text-primary hover:bg-primary/5"
                                  >
                                      <span className="inline-flex items-center gap-1 h-8">
                                          <MdDownload size={14} className="shrink-0" />
                                          <span>Download ZIP</span>
                                      </span>
                                  </Button>
                              )}
                          </div>
                          {previewData[`${side}_design_details`] && (
                              <div className="mt-3 flex flex-col gap-1 text-xs text-secondary justify-center items-center">
                                  {previewData[`${side}_design_details`].fonts?.length > 0 && (
                                      <div><strong>Fonts:</strong> {previewData[`${side}_design_details`].fonts.join(', ')}</div>
                                  )}
                                  {previewData[`${side}_design_details`].colors?.length > 0 && (
                                      <div className="flex gap-1 items-center"><strong>Colors:</strong>
                                          {previewData[`${side}_design_details`].colors.map(c => (
                                              <span key={c} className="w-3 h-3 rounded-full inline-block border border-border" style={{backgroundColor: c}} title={c}></span>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-dark font-heading border-b border-border pb-2 mb-1 uppercase tracking-wider text-secondary">Customer Details</h3>
                  <div className="grid gap-1">
                    {[
                      ["Request Number", `${previewData.request_number}`],
                      ["Customer Name", previewData.customer_name],
                      ["Email Address", previewData.email],
                      ["Phone Number", previewData.phone_number || "N/A"],
                      ["Quantity Needed", previewData.quantity],
                      ["Current Status", <StatusBadge status={previewData.status} />],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center text-sm border-b border-border/40 py-2.5 last:border-0 last:pb-0 last:py-0">
                        <span className="text-secondary font-medium">{label}</span>
                        <span className="font-semibold text-dark text-right break-all max-w-[60%]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {previewData.size_breakdown && Object.keys(previewData.size_breakdown).length > 0 && (
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-dark font-heading border-b border-border pb-1.5 mb-2.5 uppercase tracking-wider text-secondary">Size Breakdown</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(previewData.size_breakdown).map(([size, qty]) => (
                        <div
                          key={size}
                          className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-border bg-background"
                        >
                          <span className="text-[10px] uppercase font-bold text-secondary">{size}</span>
                          <span className="text-sm font-bold text-dark mt-0.5">{qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewData.notes && (
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-dark font-heading border-b border-border pb-1.5 mb-2 uppercase tracking-wider text-secondary">Customer Notes</h3>
                    <p className="text-xs leading-relaxed text-dark whitespace-pre-wrap bg-background p-2.5 rounded-lg border border-border/40 m-0">{previewData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    {completionConfirmOpen && (
      <Modal
        isOpen={completionConfirmOpen}
        onClose={() => setCompletionConfirmOpen(false)}
        title="Warning: Irreversible Action"
        width="400px"
      >
        <div className="text-dark p-2">
          <p className="mb-4">
            Marking this request as <strong>Completed</strong> will permanently delete all associated original PNG files from Google Drive.
          </p>
          <p className="mb-6">
            Are you sure you want to proceed?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCompletionConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-danger hover:bg-danger/80"
              onClick={executeStatusUpdate}
              isLoading={updating}
            >
              Confirm & Complete
            </Button>
          </div>
        </div>
      </Modal>
    )}
    </div>
  );
}

export default Requests;
