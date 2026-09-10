import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Image, Transformer, Text } from "react-konva";
import { toast } from "react-hot-toast";
import { FRONT_IMAGES, BACK_IMAGES } from "./shirtImages";
import QuoteModal from "../../components/QuoteModal/QuoteModal";
import OTPModal from "../../components/OTPModal/OTPModal";
import FontPicker from "../../components/FontPicker/FontPicker";
import Button from "../../components/Button/Button";
import { useAuth } from "../../context/AuthContext";
import { sendOTP, verifyOTP } from "../../services/authService";
import { createDesign } from "../../services/designService";
import { sendQuote } from "../../services/requestService";
import html2canvas from "html2canvas";
import ThreadReelLoader from "../../components/QuoteLoader/QuoteLoader";
import OtpAuthLoader from "../../components/OTPLoader/OTPLoader";

function Design() {
    const [currentSide, setCurrentSide] = useState("front");
    const [selectedObject, setSelectedObject] = useState(null);
    const stageRef = useRef(null);
    const [shirtColor, setShirtColor] = useState("white");
    const [pendingDesign, setPendingDesign] = useState(null);
    const [textInput, setTextInput] = useState("");
    const transformerRef = useRef(null);
    const logoRefs = useRef({});
    const textRefs = useRef({});
    const { login, customer } = useAuth();
    const previewRef = useRef(null);
    const textColorScrollRef = useRef(null);
    const shirtColorScrollRef = useRef(null);

    const scrollCarousel = (ref, direction) => {
        if (ref.current) {
            ref.current.scrollBy({ left: direction * 150, behavior: "smooth" });
        }
    };

    const [showOTPModal, setShowOTPModal] = useState(false);
    const [pendingQuote, setPendingQuote] = useState(null);
    const [otpEmail, setOtpEmail] = useState("");
    const [otpMode, setOtpMode] = useState("otp");
    const [submitting, setSubmitting] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [showOTPLoader, setShowOTPLoader] = useState(false);
    const [otpPhase, setOtpPhase] = useState("sending");
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [designData, setDesignData] = useState({
        front: {
            logoFile: null,
            logoImage: null,
            logos: [],
            texts: []
        },
        back: {
            logoFile: null,
            logoImage: null,
            logos: [],
            texts: []
        },
    });

    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);
    const isFirstRender = useRef(true);
    const ignoreHistory = useRef(false);

    const activeDesign = designData[currentSide];

    const selectedText =
        selectedObject?.type === "text"
            ? activeDesign.texts.find(
                item => item.id === selectedObject.id
            )
            : null;

    const selectedLogo =
        selectedObject?.type === "logo"
            ? activeDesign.logos.find(
                logo => logo.id === selectedObject.id
            )
            : null;

    const logos = activeDesign.logos;

    useEffect(() => {
        if (!transformerRef.current) return;

        if (!selectedObject) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
            return;
        }

        let node = null;
        if (selectedObject.type === "logo") {
            node = logoRefs.current[selectedObject.id];
        } else if (selectedObject.type === "text") {
            node = textRefs.current[selectedObject.id];
        }

        if (node) {
            transformerRef.current.nodes([node]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selectedObject, currentSide, designData]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (ignoreHistory.current) {
            ignoreHistory.current = false;
            return;
        }

        setHistory(prev => [
            ...prev,
            JSON.parse(JSON.stringify(designData))
        ]);

        setFuture([]);
    }, [designData]);

    const undo = () => {
        if (history.length === 0) return;

        ignoreHistory.current = true;
        const previous = history[history.length - 1];

        setFuture(prev => [
            JSON.parse(JSON.stringify(designData)),
            ...prev,
        ]);

        setHistory(prev => prev.slice(0, -1));
        setDesignData(previous);
    };

    const redo = () => {
        if (future.length === 0) return;

        ignoreHistory.current = true;
        const next = future[0];

        setHistory(prev => [
            ...prev,
            JSON.parse(JSON.stringify(designData))
        ]);

        setFuture(prev => prev.slice(1));
        setDesignData(next);
    };

    const capturePreview = async () => {
        const canvas = await html2canvas(previewRef.current, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
        });

        return await new Promise((resolve) => {
            canvas.toBlob(resolve, "image/png");
        });
    };

    const resetDesigner = () => {
        setDesignData({
            front: {
                logos: [],
                texts: [],
                logoFile: null,
                logoImage: null,
            },
            back: {
                logos: [],
                texts: [],
                logoFile: null,
                logoImage: null,
            },
        });

        setCurrentSide("front");
        setShirtColor("white");
        setSelectedObject(null);
        setTextInput("");
    };

    const navigate = useNavigate();

    const handleGetQuote = async () => {
        try {
            const formData = new FormData();

            formData.append(
                "design_name",
                "Custom Design"
            );

            const extractDesignDetails = (sideData) => {
                const fonts = new Set();
                const colors = new Set();
                sideData.texts.forEach(t => {
                    if (t.fontFamily) fonts.add(t.fontFamily);
                    if (t.color) colors.add(t.color);
                });
                return { fonts: Array.from(fonts), colors: Array.from(colors) };
            };

            formData.append(
                "front_design_json",
                JSON.stringify(extractDesignDetails(designData.front))
            );

            formData.append(
                "back_design_json",
                JSON.stringify(extractDesignDetails(designData.back))
            );

            designData.front.logos.forEach(logo => {
                if (logo.file) formData.append("front_png_files", logo.file);
            });
            
            designData.back.logos.forEach(logo => {
                if (logo.file) formData.append("back_png_files", logo.file);
            });

            const originalSide = currentSide;

            // ---------- FRONT ----------
            setCurrentSide("front");
            await new Promise(resolve => setTimeout(resolve, 300));
            const frontBlob = await capturePreview();

            formData.append(
                "front_preview_image",
                frontBlob,
                "front.png"
            );

            // ---------- BACK ----------
            setCurrentSide("back");
            await new Promise(resolve => setTimeout(resolve, 300));
            const backBlob = await capturePreview();

            formData.append(
                "back_preview_image",
                backBlob,
                "back.png"
            );

            setCurrentSide(originalSide);
            setPendingDesign(formData);
            setShowQuoteModal(true);
        } catch (error) {
            console.log(error);
            toast.error("Failed to save design.");
        }
    };

    const handleVerifyOTP = async (data) => {
        setVerifying(true);
        setShowOTPModal(false);
        setOtpPhase("verifying");
        setShowOTPLoader(true);

        try {
            const res = await verifyOTP(data);
            login(res.data);
            const designResponse = await createDesign(pendingDesign);
            const designId = designResponse.data.data.id;
            const finalPayload = {
                ...pendingQuote,
                design_id: designId,
            };
            await sendQuote(finalPayload);
            setOtpPhase("success");
        } catch (err) {
            setShowOTPLoader(false);
            setShowOTPModal(true);
            console.log(err);
            toast.error("OTP verification failed. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const handleQuoteSubmit = async (data) => {
        setSubmitting(true);
        setShowLoader(true);

        try {
            const payload = {
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
                }
            };

            if (customer) {
                const designResponse = await createDesign(pendingDesign);
                payload.design_id = designResponse.data.data.id;
                await sendQuote(payload);

                setShowLoader(false);
                setShowQuoteModal(false);
                resetDesigner();
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
                if (otpErr.response?.status === 429) {
                    console.log("OTP recently sent, continuing to verification modal.");
                } else {
                    throw otpErr;
                }
            }

            setShowOTPLoader(false);
            setPendingQuote(payload);
            setOtpEmail(payload.email);
            setShowQuoteModal(false);
            setOtpMode("otp");
            setShowOTPModal(true);
        } catch (err) {
            setShowLoader(false);
            setShowOTPLoader(false);
            console.log(err);
            toast.error("Failed to submit quote. Please check your details and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 md:px-10 lg:px-16 font-body text-dark flex justify-center">
            <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-start">

                {/* ═══════════ LEFT TOOLBAR ═══════════ */}
                <div className="w-full lg:w-96 shrink-0 rounded-card border border-border bg-surface p-6 shadow-md shadow-primary/5 flex flex-col gap-6">

                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <h2 className="text-xl font-extrabold font-heading text-dark">Customize</h2>
                        <div className="flex gap-2">
                            <button
                                className="w-9 h-9 rounded-button bg-background border border-border hover:bg-border/30 text-dark font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={undo}
                                disabled={history.length === 0}
                                title="Undo"
                            >
                                ↩
                            </button>
                            <button
                                className="w-9 h-9 rounded-button bg-background border border-border hover:bg-border/30 text-dark font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={redo}
                                disabled={future.length === 0}
                                title="Redo"
                            >
                                ↪
                            </button>
                        </div>
                    </div>

                    {/* Front / Back Tab Toggle */}
                    <div className="flex rounded-button bg-background p-1 border border-border">
                        <button
                            className={`flex-1 py-2 rounded-button text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                currentSide === "front"
                                    ? "bg-primary text-surface shadow-xs"
                                    : "text-secondary hover:text-dark"
                            }`}
                            onClick={() => setCurrentSide("front")}
                        >
                            Front
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-button text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                currentSide === "back"
                                    ? "bg-primary text-surface shadow-xs"
                                    : "text-secondary hover:text-dark"
                            }`}
                            onClick={() => setCurrentSide("back")}
                        >
                            Back
                        </button>
                    </div>

                    {/* ── Text Section ── */}
                    <div className="flex flex-col gap-3 pb-5 border-b border-border">
                        <p className="text-xs font-bold uppercase tracking-wider text-secondary font-heading">✏️ Add Text</p>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Enter text"
                                value={textInput}
                                className="w-full bg-background text-dark border border-border rounded-input p-3 text-sm font-body focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-secondary/60"
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTextInput(value);

                                    if (selectedObject?.type === "text") {
                                        setDesignData(prev => ({
                                            ...prev,
                                            [currentSide]: {
                                                ...prev[currentSide],
                                                texts: prev[currentSide].texts.map(item =>
                                                    item.id === selectedObject?.id
                                                        ? { ...item, value }
                                                        : item
                                                )
                                            }
                                        }));
                                    }
                                }}
                            />
                            <button
                                className="w-full py-3 bg-primary hover:bg-primary-hover text-surface font-semibold rounded-button transition-colors duration-150 cursor-pointer shadow-xs text-sm"
                                onClick={() => {
                                    if (!textInput.trim()) return;
                                    if (selectedObject?.type === "text") return;

                                    setDesignData(prev => ({
                                        ...prev,
                                        [currentSide]: {
                                            ...prev[currentSide],
                                            texts: [
                                                ...prev[currentSide].texts,
                                                {
                                                    id: Date.now(),
                                                    value: textInput,
                                                    x: 220,
                                                    y: 180,
                                                    color: "#000000",
                                                    fontSize: 32,
                                                    fontFamily: "Arial",
                                                    rotation: 0,
                                                }
                                            ]
                                        }
                                    }));
                                    setTextInput("");
                                }}
                            >
                                Add Text
                            </button>
                        </div>
                    </div>

                    {/* ── Text Color ── */}
                    <div className="flex flex-col gap-3 pb-5 border-b border-border">
                        <p className="text-xs font-bold uppercase tracking-wider text-secondary font-heading">🎨 Text Color</p>
                        <div className="flex items-center gap-2 relative">
                            <button
                                className="w-8 h-8 rounded-full bg-background border border-border text-dark hover:border-primary hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold text-sm"
                                onClick={() => scrollCarousel(textColorScrollRef, -1)}
                            >
                                ‹
                            </button>
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 scroll-smooth w-full" ref={textColorScrollRef}>
                                {["#000000", "#ffffff", "#ff0000", "#0000ff", "#008000", "#ffff00", "#ff9800", "#800080"].map(color => (
                                    <div
                                        key={color}
                                        className={`w-7 h-7 rounded-full border border-border shadow-xs cursor-pointer transition-transform hover:scale-110 shrink-0 ${
                                            selectedText?.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                                        }`}
                                        style={{ background: color }}
                                        onClick={() => {
                                            if (!selectedText) return;
                                            setDesignData(prev => ({
                                                ...prev,
                                                [currentSide]: {
                                                    ...prev[currentSide],
                                                    texts: prev[currentSide].texts.map(item =>
                                                        item.id === selectedText.id ? { ...item, color } : item
                                                    )
                                                }
                                            }));
                                        }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    className="w-7 h-7 rounded-full border border-border cursor-pointer shrink-0 appearance-none bg-transparent"
                                    value={selectedText?.color || "#000000"}
                                    onChange={(e) => {
                                        if (!selectedText) return;
                                        const color = e.target.value;
                                        setDesignData(prev => ({
                                            ...prev,
                                            [currentSide]: {
                                                ...prev[currentSide],
                                                texts: prev[currentSide].texts.map(item =>
                                                    item.id === selectedText.id ? { ...item, color } : item
                                                )
                                            }
                                        }));
                                    }}
                                />
                            </div>
                            <button
                                className="w-8 h-8 rounded-full bg-background border border-border text-dark hover:border-primary hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold text-sm"
                                onClick={() => scrollCarousel(textColorScrollRef, 1)}
                            >
                                ›
                            </button>
                        </div>
                    </div>

                    {/* ── Font Size ── */}
                    <div className="flex flex-col gap-3 pb-5 border-b border-border">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-secondary font-heading">
                            <span>📐 Font Size</span>
                            <span className="text-primary font-bold">{selectedText?.fontSize || 32}px</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={selectedText?.fontSize || 32}
                            className="w-full accent-primary bg-background cursor-pointer"
                            onChange={(e) => {
                                if (!selectedText) return;
                                const fontSize = Number(e.target.value);
                                setDesignData(prev => ({
                                    ...prev,
                                    [currentSide]: {
                                        ...prev[currentSide],
                                        texts: prev[currentSide].texts.map(item =>
                                            item.id === selectedText.id
                                                ? { ...item, fontSize }
                                                : item
                                        )
                                    }
                                }));
                            }}
                        />
                    </div>

                    {/* ── Font Family ── */}
                    <div className="flex flex-col gap-3 pb-5 border-b border-border">
                        <p className="text-xs font-bold uppercase tracking-wider text-secondary font-heading">🔤 Font Family</p>
                        <FontPicker
                            value={selectedText?.fontFamily || "Arial"}
                            disabled={!selectedText}
                            onChange={(font) => {
                                if (!selectedText) return;
                                setDesignData((prev) => ({
                                    ...prev,
                                    [currentSide]: {
                                        ...prev[currentSide],
                                        texts: prev[currentSide].texts.map((item) =>
                                            item.id === selectedText.id
                                                ? { ...item, fontFamily: font }
                                                : item
                                        ),
                                    },
                                }));
                            }}
                        />
                    </div>

                    {/* ── T-Shirt Color ── */}
                    <div className="flex flex-col gap-3 pb-5 border-b border-border">
                        <p className="text-xs font-bold uppercase tracking-wider text-secondary font-heading">👕 T-Shirt Color</p>
                        <div className="flex items-center gap-2 relative">
                            <button
                                className="w-8 h-8 rounded-full bg-background border border-border text-dark hover:border-primary hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold text-sm"
                                onClick={() => scrollCarousel(shirtColorScrollRef, -1)}
                            >
                                ‹
                            </button>
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 scroll-smooth w-full" ref={shirtColorScrollRef}>
                                {[
                                    { name: "white", hex: "#ffffff" },
                                    { name: "black", hex: "#111111" },
                                    { name: "brown", hex: "#5c4033" },
                                    { name: "green", hex: "#22c55e" },
                                    { name: "grey", hex: "#808080" },
                                    { name: "litbrown", hex: "#c4a484" },
                                    { name: "navy", hex: "#1e3a5f" },
                                    { name: "orange", hex: "#f97316" },
                                    { name: "peach", hex: "#ffcba4" },
                                    { name: "pink", hex: "#ffc0cb" },
                                    { name: "purple", hex: "#800080" },
                                    { name: "red", hex: "#ef4444" },
                                    { name: "yellow", hex: "#facc15" },
                                ].map(({ name, hex }) => (
                                    <div
                                        key={name}
                                        className={`w-7 h-7 rounded-full border border-border shadow-xs cursor-pointer transition-transform hover:scale-110 shrink-0 ${
                                            shirtColor === name ? "ring-2 ring-primary ring-offset-2" : ""
                                        }`}
                                        style={{ background: hex }}
                                        onClick={() => setShirtColor(name)}
                                        title={name}
                                    />
                                ))}
                            </div>
                            <button
                                className="w-8 h-8 rounded-full bg-background border border-border text-dark hover:border-primary hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold text-sm"
                                onClick={() => scrollCarousel(shirtColorScrollRef, 1)}
                            >
                                ›
                            </button>
                        </div>
                    </div>

                    {/* ── Upload Logo ── */}
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-secondary font-heading">🖼 Upload Logo</p>
                        <label className="w-full py-3 px-4 bg-background border-2 border-dashed border-border hover:border-primary text-secondary hover:text-primary font-semibold rounded-card transition-all cursor-pointer flex items-center justify-center gap-2 text-sm">
                            <span>Choose File</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    const image = new window.Image();
                                    image.src = URL.createObjectURL(file);
                                    image.onload = () => {
                                        setDesignData(prev => ({
                                            ...prev,
                                            [currentSide]: {
                                                ...prev[currentSide],
                                                logos: [
                                                    ...prev[currentSide].logos,
                                                    {
                                                        id: Date.now(),
                                                        image,
                                                        file,
                                                        x: 250,
                                                        y: 170,
                                                        width: 120,
                                                        height: 120,
                                                        rotation: 0,
                                                    }
                                                ]
                                            }
                                        }));
                                    };
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    </div>

                </div>

                {/* ═══════════ RIGHT PREVIEW ═══════════ */}
                <div className="flex-1 w-full rounded-card border border-border bg-surface p-6 shadow-md flex flex-col items-center justify-between min-h-[600px] gap-6">

                    {/* ── Top Header with Get Quote ── */}
                    <div className="w-full flex items-center justify-between border-b border-border pb-4">
                        <h3 className="text-xl font-bold font-heading text-dark">Design Preview</h3>
                        <Button
                            className="text-sm"
                            variant="primary"
                            size="md"
                            onClick={handleGetQuote}
                            isLoading={submitting}
                        >
                            🏷 Get Quote
                        </Button>
                    </div>

                    <div className="relative w-full max-w-[700px] flex justify-center items-center overflow-hidden py-4 bg-background/50 rounded-card border border-border/50">
                        <div className="relative w-[700px] h-[820px] flex justify-center items-center max-w-full" ref={previewRef}>

                            <img
                                src={
                                    currentSide === "front"
                                        ? FRONT_IMAGES[shirtColor]
                                        : BACK_IMAGES[shirtColor]
                                }
                                alt="Tshirt"
                                className="w-full h-full object-contain pointer-events-none select-none"
                            />

                            {selectedObject && (
                                <button
                                    className="absolute z-30 w-8 h-8 rounded-full bg-danger text-surface flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer text-sm border border-surface"
                                    style={{
                                        left:
                                            selectedObject?.type === "logo"
                                                ? selectedLogo?.x + selectedLogo?.width + 15
                                                : selectedText?.x + 120,
                                        top:
                                            selectedObject?.type === "logo"
                                                ? selectedLogo?.y - 20
                                                : selectedText?.y - 20,
                                    }}
                                    onClick={() => {
                                        if (!selectedObject) return;

                                        if (selectedObject.type === "logo") {
                                            setDesignData(prev => ({
                                                ...prev,
                                                [currentSide]: {
                                                    ...prev[currentSide],
                                                    logos: prev[currentSide].logos.filter(
                                                        logo => logo.id !== selectedObject.id
                                                    )
                                                }
                                            }));
                                        } else if (selectedObject.type === "text") {
                                            setDesignData(prev => ({
                                                ...prev,
                                                [currentSide]: {
                                                    ...prev[currentSide],
                                                    texts: prev[currentSide].texts.filter(
                                                        item => item.id !== selectedObject.id
                                                    )
                                                }
                                            }));
                                        }

                                        setSelectedObject(null);
                                        if (transformerRef.current) {
                                            transformerRef.current.nodes([]);
                                            transformerRef.current.getLayer()?.batchDraw();
                                        }
                                    }}
                                    title="Delete Element"
                                >
                                    🗑
                                </button>
                            )}

                            <Stage
                                ref={stageRef}
                                width={700}
                                height={820}
                                className="absolute inset-0"
                                onMouseDown={(e) => {
                                    if (e.target === e.target.getStage()) {
                                        setSelectedObject(null);
                                    }
                                }}
                            >
                                <Layer>
                                    {/* ---------- LOGO ---------- */}
                                    {logos.map((logo) => (
                                        <Image
                                            key={logo.id}
                                            ref={(node) => {
                                                if (node) {
                                                    logoRefs.current[logo.id] = node;
                                                }
                                            }}
                                            image={logo.image}
                                            x={logo.x}
                                            y={logo.y}
                                            width={logo.width}
                                            height={logo.height}
                                            rotation={logo.rotation}
                                            draggable
                                            onClick={() => {
                                                setSelectedObject({
                                                    type: "logo",
                                                    id: logo.id,
                                                });
                                            }}
                                            onTap={() => {
                                                setSelectedObject({
                                                    type: "logo",
                                                    id: logo.id,
                                                });
                                            }}
                                            onDragEnd={(e) => {
                                                setDesignData(prev => ({
                                                    ...prev,
                                                    [currentSide]: {
                                                        ...prev[currentSide],
                                                        logos: prev[currentSide].logos.map(item =>
                                                            item.id === logo.id
                                                                ? {
                                                                    ...item,
                                                                    x: e.target.x(),
                                                                    y: e.target.y(),
                                                                }
                                                                : item
                                                        )
                                                    }
                                                }));
                                            }}
                                            onTransformEnd={(e) => {
                                                const node = e.target;
                                                const scaleX = node.scaleX();
                                                const scaleY = node.scaleY();

                                                setDesignData(prev => ({
                                                    ...prev,
                                                    [currentSide]: {
                                                        ...prev[currentSide],
                                                        logos: prev[currentSide].logos.map(item =>
                                                            item.id === logo.id
                                                                ? {
                                                                    ...item,
                                                                    x: node.x(),
                                                                    y: node.y(),
                                                                    width: Math.max(
                                                                        20,
                                                                        node.width() * scaleX
                                                                    ),
                                                                    height: Math.max(
                                                                        20,
                                                                        node.height() * scaleY
                                                                    ),
                                                                    rotation: node.rotation(),
                                                                }
                                                                : item
                                                        )
                                                    }
                                                }));

                                                node.scaleX(1);
                                                node.scaleY(1);
                                            }}
                                        />
                                    ))}

                                    <Transformer
                                        ref={transformerRef}
                                        rotateEnabled={true}
                                        enabledAnchors={[
                                            "top-left",
                                            "top-right",
                                            "bottom-left",
                                            "bottom-right",
                                        ]}
                                    />

                                    {/* ---------- TEXT ---------- */}
                                    {activeDesign.texts.map((text) => (
                                        <Text
                                            ref={(node) => {
                                                if (node) {
                                                    textRefs.current[text.id] = node;
                                                }
                                            }}
                                            key={text.id}
                                            text={text.value}
                                            x={text.x}
                                            y={text.y}
                                            fill={text.color}
                                            fontSize={text.fontSize}
                                            fontFamily={text.fontFamily}
                                            rotation={text.rotation}
                                            draggable
                                            onClick={() => {
                                                setSelectedObject({
                                                    type: "text",
                                                    id: text.id,
                                                });
                                                setTextInput(text.value);
                                            }}
                                            onTap={() => {
                                                setSelectedObject({
                                                    type: "text",
                                                    id: text.id,
                                                });
                                                setTextInput(text.value);
                                            }}
                                            onDragEnd={(e) => {
                                                setDesignData(prev => ({
                                                    ...prev,
                                                    [currentSide]: {
                                                        ...prev[currentSide],
                                                        texts: prev[currentSide].texts.map(item =>
                                                            item.id === text.id
                                                                ? {
                                                                    ...item,
                                                                    x: e.target.x(),
                                                                    y: e.target.y(),
                                                                }
                                                                : item
                                                        )
                                                    }
                                                }));
                                            }}
                                            onTransformEnd={(e) => {
                                                const node = e.target;
                                                const scaleX = node.scaleX();

                                                setDesignData(prev => ({
                                                    ...prev,
                                                    [currentSide]: {
                                                        ...prev[currentSide],
                                                        texts: prev[currentSide].texts.map(item =>
                                                            item.id === text.id
                                                                ? {
                                                                    ...item,
                                                                    x: node.x(),
                                                                    y: node.y(),
                                                                    fontSize: Math.max(
                                                                        12,
                                                                        item.fontSize * scaleX
                                                                    ),
                                                                    rotation: node.rotation(),
                                                                }
                                                                : item
                                                        )
                                                    }
                                                }));

                                                node.scaleX(1);
                                                node.scaleY(1);
                                            }}
                                        />
                                    ))}
                                </Layer>
                            </Stage>
                        </div>
                    </div>

                </div>

            </div>

            <QuoteModal
                open={showQuoteModal}
                onClose={() => setShowQuoteModal(false)}
                onSubmit={handleQuoteSubmit}
                loading={submitting}
                customer={customer}
            />

            <OTPModal
                open={showOTPModal}
                mode={otpMode}
                email={otpEmail}
                loading={verifying}
                onVerify={handleVerifyOTP}
                onClose={() => {
                    if (otpMode === "success") {
                        resetDesigner();
                        setShowOTPModal(false);
                        setOtpMode("otp");
                        navigate("/my-designs");
                        return;
                    }

                    setShowOTPModal(false);
                    setOtpMode("otp");
                    setPendingQuote(null);
                    setPendingDesign(null);
                    setOtpEmail("");
                }}
            />

            {showLoader && (
                <div className="fixed inset-0 bg-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <ThreadReelLoader
                        theme="light"
                        isLoading={true}
                        messages={[
                            "Preparing your quotation...",
                            "Packing your custom T-shirt...",
                            "Sending your request to our production team...",
                            "Processing your design...",
                            "Almost ready..."
                        ]}
                    />
                </div>
            )}

            <OtpAuthLoader
                isLoading={showOTPLoader}
                phase={otpPhase}
                theme="light"
                onComplete={() => {
                    setShowOTPLoader(false);
                    setPendingDesign(null);
                    setPendingQuote(null);
                    setOtpEmail("");
                    setOtpMode("success");
                    setShowOTPModal(true);
                }}
            />
        </div>
    );
}

export default Design;