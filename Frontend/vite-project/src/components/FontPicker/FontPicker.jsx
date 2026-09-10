const FONTS = [
    { value: "Arial", label: "Arial", fontFamily: "Arial, Helvetica, sans-serif" },
    { value: "Poppins", label: "Poppins", fontFamily: '"Poppins", Arial, sans-serif' },
    { value: "Roboto", label: "Roboto", fontFamily: '"Roboto", Arial, sans-serif' },
    { value: "Montserrat", label: "Montserrat", fontFamily: '"Montserrat", Arial, sans-serif' },
    { value: "Oswald", label: "Oswald", fontFamily: '"Oswald", Arial, sans-serif' },
    { value: "Bebas Neue", label: "Bebas Neue", fontFamily: '"Bebas Neue", Arial, sans-serif' },
    { value: "Anton", label: "Anton", fontFamily: '"Anton", Arial, sans-serif' },
    { value: "Raleway", label: "Raleway", fontFamily: '"Raleway", Arial, sans-serif' },
    { value: "Rubik", label: "Rubik", fontFamily: '"Rubik", Arial, sans-serif' },
    { value: "Playfair Display", label: "Playfair Display", fontFamily: '"Playfair Display", Georgia, serif' },
    { value: "Lobster", label: "Lobster", fontFamily: '"Lobster", Arial, sans-serif' },
    { value: "Pacifico", label: "Pacifico", fontFamily: '"Pacifico", Arial, sans-serif' },
    { value: "Caveat", label: "Caveat", fontFamily: '"Caveat", Arial, sans-serif' },
    { value: "Dancing Script", label: "Dancing Script", fontFamily: '"Dancing Script", Arial, sans-serif' },
    { value: "Georgia", label: "Georgia", fontFamily: "Georgia, serif" },
    { value: "Verdana", label: "Verdana", fontFamily: "Verdana, Geneva, sans-serif" },
    { value: "Times New Roman", label: "Times New Roman", fontFamily: '"Times New Roman", Georgia, serif' },
];

function FontPicker({ value, onChange, disabled }) {
    const selectedFont = FONTS.find((font) => font.value === value) ?? FONTS[0];

    return (
        <select
            className="w-full bg-background text-dark border border-border rounded-input p-3 text-sm font-body focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{ fontFamily: selectedFont.fontFamily }}
        >
            {FONTS.map((font) => (
                <option
                    key={font.value}
                    value={font.value}
                    style={{ fontFamily: font.fontFamily }}
                >
                    {font.label}
                </option>
            ))}
        </select>
    );
}

export default FontPicker;