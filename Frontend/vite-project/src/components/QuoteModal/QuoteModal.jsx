import { useState, useEffect } from "react";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";

function QuoteModal({ open, onClose, onSubmit, loading, customer }) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
        xs: "",
        s: "",
        m: "",
        l: "",
        xl: "",
        xxl: "",
    });

    useEffect(() => {
        if (open) {
            setForm({
                name: customer?.full_name || "",
                email: customer?.email || "",
                phone: customer?.phone_number || "",
                notes: "",
                xs: "",
                s: "",
                m: "",
                l: "",
                xl: "",
                xxl: "",
            });
        }
    }, [open, customer]);

    if (!open) return null;

    const isLoggedIn = Boolean(customer);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const totalQty =
        Number(form.xs || 0) +
        Number(form.s || 0) +
        Number(form.m || 0) +
        Number(form.l || 0) +
        Number(form.xl || 0) +
        Number(form.xxl || 0);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({
            ...form,
            total_quantity: totalQty,
        });
    };

    const fieldClasses =
        "w-full rounded-[18px] border border-border bg-background px-4 py-3 text-sm font-body text-dark outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20";

    return (
        <Modal isOpen={open} onClose={onClose} title="Request Quote">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm leading-7 text-secondary">
                                Provide your contact details, required sizes, and any special notes for a fast quote.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-semibold text-dark">Name</span>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="CrazyFits"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className={fieldClasses}
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-semibold text-dark">Email</span>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="crazyfits@example.com"
                                    value={form.email}
                                    onChange={isLoggedIn ? undefined : handleChange}
                                    readOnly={isLoggedIn}
                                    required
                                    title={isLoggedIn ? "Email is locked to your logged-in account" : ""}
                                    className={`${fieldClasses} ${isLoggedIn ? "cursor-not-allowed opacity-80" : ""}`}
                                />
                            </label>

                            <label className="space-y-2 md:col-span-2">
                                <span className="text-sm font-semibold text-dark">Phone Number</span>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="(123) 456-7890"
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                    className={fieldClasses}
                                />
                            </label>
                        </div>

                        <div className="rounded-[20px] border border-border bg-background p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-dark">Quantity Breakdown</h3>
                                    <p className="text-xs text-secondary">Enter the quantity for each size you require.</p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                    <span>Total</span>
                                    <span className="rounded-full bg-primary/20 px-3 py-1">{totalQty}</span>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                {['xs', 's', 'm', 'l', 'xl', 'xxl'].map((size) => (
                                    <label key={size} className="space-y-2 text-center">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                                            {size}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            name={size}
                                            value={form[size]}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full rounded-[18px] border border-border bg-background px-3 py-2 text-center text-sm font-body text-dark outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="space-y-2">
                            <span className="text-sm font-semibold text-dark">Notes</span>
                            <textarea
                                name="notes"
                                placeholder="Add any special instructions or design notes"
                                value={form.notes}
                                onChange={handleChange}
                                rows={5}
                                className={`${fieldClasses} min-h-[140px] resize-none`}
                            />
                        </label>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="secondary" size="md" className="w-full sm:w-auto" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="md" className="w-full sm:w-auto" type="submit" isLoading={loading}>
                        Submit Quote
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default QuoteModal;
