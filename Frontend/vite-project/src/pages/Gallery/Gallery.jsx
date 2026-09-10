import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CategoryTabs from "./CategoryTabs";
import GalleryCard from "./GalleryCard";
import QuoteModal from "../../components/QuoteModal/QuoteModal";
import OTPModal from "../../components/OTPModal/OTPModal";
import ThreadReelLoader from "../../components/QuoteLoader/QuoteLoader";
import OtpAuthLoader from "../../components/OTPLoader/OTPLoader";
import { sendOTP, verifyOTP } from "../../services/authService";
import { getCategories, getDesigns } from "../../services/galleryService";
import { sendQuote } from "../../services/requestService";

const preloadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = src;
  });

function Gallery() {
  const [categories, setCategories] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingQuote, setPendingQuote] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpMode, setOtpMode] = useState("otp");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { login, customer } = useAuth();
  const [showLoader, setShowLoader] = useState(false);
  const [showOTPLoader, setShowOTPLoader] = useState(false);
  const [otpPhase, setOtpPhase] = useState("sending");
  const [showPreview, setShowPreview] = useState(false);
  const [previewDesign, setPreviewDesign] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Unable to load categories.");
    }
  }, []);

  const loadDesigns = useCallback(async (categoryId = null) => {
    try {
      setLoading(true);
      const data = await getDesigns(categoryId);
      setDesigns(data);
    } catch (error) {
      toast.error("Unable to load gallery designs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (categoryId) {
      loadDesigns(categoryId);
      setSelectedCategory(Number(categoryId));
    } else {
      loadDesigns();
      setSelectedCategory(null);
    }
  }, [categoryId, loadDesigns]);

  useEffect(() => {
    if (!showPreview || !previewDesign) return;

    let active = true;
    setPreviewLoading(true);
    setPreviewError(null);

    const frontUrl = previewDesign.front_image_url;
    const backUrl = previewDesign.back_image_url;

    if (!frontUrl || !backUrl) {
      setPreviewLoading(false);
      setPreviewError("Preview images are unavailable. Please try another design.");
      return;
    }

    Promise.all([preloadImage(frontUrl), preloadImage(backUrl)])
      .then(() => {
        if (active) {
          setPreviewLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setPreviewLoading(false);
          setPreviewError("Unable to load preview images. Please try again.");
        }
      });

    return () => {
      active = false;
    };
  }, [previewDesign, showPreview]);

  useEffect(() => {
    if (!showPreview) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreview]);


  const handleCategory = useCallback(
    (id) => {
      setSelectedCategory(id);
      loadDesigns(id);
    },
    [loadDesigns]
  );

  const handleQuote = useCallback((design) => {
    setSelectedDesign(design);
    setShowQuoteModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowQuoteModal(false);
    setSelectedDesign(null);
  }, []);

  const handlePreview = useCallback((design) => {
    setPreviewDesign(design);
    setShowPreview(true);
  }, []);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewDesign(null);
    setPreviewLoading(false);
    setPreviewError(null);
  }, []);

  const handleQuoteSubmit = useCallback(
    async (data) => {
      setSubmitting(true);
      setShowLoader(true);

      try {
        const payload = {
          gallery_design_id: selectedDesign.id,
          customer_name: data.name,
          email: data.email,
          phone_number: data.phone,
          notes: data.notes,
          size_breakdown: {
            XS: Number(data.xs || 0),
            S: Number(data.s || 0),
            M: Number(data.m || 0),
            L: Number(data.l || 0),
            XL: Number(data.xl || 0),
            XXL: Number(data.xxl || 0),
          },
        };

        if (customer) {
          await sendQuote(payload);
          setShowLoader(false);
          handleCloseModal();
          setOtpMode("success");
          setShowOTPModal(true);
          return;
        }

        setShowLoader(false);
        setOtpPhase("sending");
        setShowOTPLoader(true);

        try {
          await sendOTP({ email: payload.email });
        } catch (otpErr) {
          if (otpErr.response?.status !== 429) {
            throw otpErr;
          }
        }

        setShowOTPLoader(false);
        setPendingQuote(payload);
        setOtpEmail(payload.email);
        setOtpMode("otp");
        handleCloseModal();
        setShowOTPModal(true);
      } catch (err) {
        setShowLoader(false);
        setShowOTPLoader(false);
        toast.error("Failed to submit quote. Please check your details and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [customer, handleCloseModal, selectedDesign]
  );

  const handleVerifyOTP = useCallback(
    async (data) => {
      setVerifying(true);
      setShowOTPModal(false);
      setOtpPhase("verifying");
      setShowOTPLoader(true);

      try {
        const res = await verifyOTP(data);
        login(res.data);
        await sendQuote(pendingQuote);
        setOtpPhase("success");
      } catch (err) {
        setShowOTPLoader(false);
        setShowOTPModal(true);
        toast.error("OTP verification failed. Please try again.");
      } finally {
        setVerifying(false);
      }
    },
    [login, pendingQuote]
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-dark sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-[28px] border border-border bg-surface/80 p-8 shadow-sm shadow-primary/10 backdrop-blur-sm">
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">
              CrazyFits Gallery
            </p>
            <h1 className="text-4xl font-bold text-dark font-heading sm:text-5xl">
              Discover ready-made T-Shirt designs
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-secondary sm:text-lg">
              Explore curated designs, preview front and back, then request a quote with a responsive, modern checkout flow.
            </p>
          </div>
        </div>

        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategory}
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-[520px] rounded-[28px] border border-border bg-surface shadow-sm skeleton"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div className="rounded-[28px] border border-border bg-surface p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-dark font-heading">No designs available</p>
            <p className="mt-3 text-sm leading-6 text-secondary">
              We are updating the gallery. Check back later or switch categories for new design options.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {designs.map((design) => (
              <GalleryCard
                key={design.id}
                design={design}
                onQuote={handleQuote}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </div>

      <QuoteModal
        open={showQuoteModal}
        design={selectedDesign}
        onClose={handleCloseModal}
        onSubmit={handleQuoteSubmit}
        loading={submitting}
        customer={customer}
      />

      <OTPModal
        open={showOTPModal}
        mode={otpMode}
        email={otpEmail}
        onVerify={handleVerifyOTP}
        loading={verifying}
        onClose={() => {
          if (otpMode === "success") {
            setShowOTPModal(false);
            setOtpMode("otp");
            navigate("/my-designs");
            return;
          }
          setShowOTPModal(false);
          setOtpMode("otp");
          setPendingQuote(null);
          setOtpEmail("");
          setSelectedDesign(null);
        }}
      />

      {showLoader && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur-sm px-4 py-6">
          <div className="flex max-w-lg flex-col items-center gap-6 rounded-[28px] border border-border bg-surface p-8 shadow-2xl">
            <ThreadReelLoader
              theme="light"
              isLoading={true}
              messages={[
                "Preparing your quotation...",
                "Checking your details...",
                "Sending your request...",
                "Creating your quote...",
                "Almost done...",
              ]}
            />
          </div>
        </div>
      )}

      <OtpAuthLoader
        isLoading={showOTPLoader}
        phase={otpPhase}
        theme="light"
        onComplete={() => {
          setShowOTPLoader(false);
          setPendingQuote(null);
          setOtpEmail("");
          setOtpMode("success");
          setShowOTPModal(true);
        }}
      />

      <AnimatePresence>
        {showPreview && previewDesign ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark/70 px-4 py-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Gallery design preview"
            >
              <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                    Design preview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-dark font-heading sm:text-3xl">
                    {previewDesign.design_name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-secondary transition duration-200 hover:border-primary hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                {previewLoading ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[24px] border border-border bg-background p-10 text-center">
                    <motion.div
                      className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20 border-t-primary"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-lg font-semibold text-dark">Loading preview</p>
                      <p className="mt-2 text-sm text-secondary">Waiting for both front and back images to finish loading.</p>
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="rounded-[24px] border border-border bg-surface p-8 text-center">
                    <p className="text-lg font-semibold text-dark">Preview error</p>
                    <p className="mt-2 text-sm leading-6 text-secondary">{previewError}</p>
                    <button
                      type="button"
                      onClick={closePreview}
                      className="mt-6 inline-flex rounded-[18px] border border-border bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                    >
                      Close preview
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4 rounded-[24px] border border-border bg-surface p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                          Front View
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-[24px] bg-background">
                        <img
                          src={previewDesign.front_image_url}
                          alt={`${previewDesign.design_name} front preview`}
                          className="h-[340px] w-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 rounded-[24px] border border-border bg-surface p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                          Back View
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-[24px] bg-background">
                        <img
                          src={previewDesign.back_image_url}
                          alt={`${previewDesign.design_name} back preview`}
                          className="h-[340px] w-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default Gallery;
