import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getSettings, updateSettings } from "../../services/settings";
import Button from "../../components/Button/Button";

const fieldClassName =
  "h-11 w-full rounded-xl border border-border bg-surface px-4 font-body text-sm text-dark shadow-sm outline-none transition-colors placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children, fullWidth = false }) {
  return (
    <div className={`space-y-2 ${fullWidth ? "md:col-span-2" : ""}`}>
      <label className="block font-heading text-sm font-semibold text-dark">
        {label}
      </label>
      {children}
    </div>
  );
}

function BusinessSettings() {
  const [formData, setFormData] = useState({
    business_name: "",
    phone_number: "",
    email: "",
    website_url: "",
    instagram_url: "",
    twitter_url: "",
    linkedin_url: "",
    design_url: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const response = await getSettings();
      setFormData({
        business_name: response.data.data.business_name || "",
        phone_number: response.data.data.phone_number || "",
        email: response.data.data.email || "",
        website_url: response.data.data.website_url || "",
        instagram_url: response.data.data.instagram_url || "",
        twitter_url: response.data.data.twitter_url || "",
        linkedin_url: response.data.data.linkedin_url || "",
        design_url: response.data.data.design_url || "",
        address: response.data.data.address || "",
      });
    } catch (error) {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await updateSettings(formData);
      setFormData(response.data.data);
      toast.success("Settings updated successfully.");
    } catch (error) {
      if (error.response?.data?.errors)
        toast.error("Please correct the validation errors.");
      else toast.error("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6">
        <div className="h-8 w-56 animate-pulse rounded bg-border/60" />
        <div className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="mb-6 h-5 w-40 animate-pulse rounded bg-border/60" />
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`space-y-2 ${index === 3 ? "md:col-span-2" : ""}`}
              >
                <div className="h-4 w-24 animate-pulse rounded bg-border/60" />
                <div
                  className={`animate-pulse rounded-xl bg-border/60 ${index === 3 ? "h-24" : "h-11"}`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="mb-6 h-5 w-40 animate-pulse rounded bg-border/60" />
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-border/60" />
                <div className="h-11 animate-pulse rounded-xl bg-border/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1 text-dark [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
      <header>
        <h1 className="m-0 font-heading text-2xl font-bold tracking-tight text-dark">
          Business Settings
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Keep your business details and social links up to date.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-heading text-lg font-bold text-dark">
              Business information
            </h2>
            <p className="mt-1 font-body text-sm text-secondary">
              Contact details shown across your business profile.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Phone number">
              <input
                type="text"
                name="phone_number"
                placeholder="+91 98765 43210"
                value={formData.phone_number}
                onChange={handleChange}
                className={fieldClassName}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                name="email"
                placeholder="hello@crazyfits.com"
                value={formData.email}
                onChange={handleChange}
                className={fieldClassName}
              />
            </Field>
            <Field label="Website URL">
              <input
                type="url"
                name="website_url"
                placeholder="https://crazyfits.com"
                value={formData.website_url}
                onChange={handleChange}
                className={fieldClassName}
              />
            </Field>
            <Field label="Address" fullWidth>
              <textarea
                rows={3}
                name="address"
                placeholder="Street, City, State, Country"
                value={formData.address}
                onChange={handleChange}
                className="min-h-24 w-full resize-y rounded-xl border border-border bg-surface p-4 font-body text-sm text-dark shadow-sm outline-none transition-colors placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </div>
        </section>
        <section className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-heading text-lg font-bold text-dark">
              Social media links
            </h2>
            <p className="mt-1 font-body text-sm text-secondary">
              Add the links customers can use to find your business.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Instagram URL">
              <input
                type="url"
                name="instagram_url"
                placeholder="https://instagram.com/yourpage"
                value={formData.instagram_url}
                onChange={handleChange}
                className={fieldClassName}
              />
            </Field>
            <Field label="Twitter / X URL">
              <input
                type="url"
                name="twitter_url"
                placeholder="https://twitter.com/yourpage"
                value={formData.twitter_url}
                onChange={handleChange}
                className={fieldClassName}
              />
            </Field>
            <Field label="Design Library">
              <input
                type="url"
                name="design_url"
                placeholder="design_drive url"
                value={formData.design_url}
                onChange={handleChange}
                className={fieldClassName}
              />
            </Field>
          </div>
        </section>
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            className="h-10 rounded-xl px-5 font-heading shadow-sm hover:shadow-md"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
export default BusinessSettings;
