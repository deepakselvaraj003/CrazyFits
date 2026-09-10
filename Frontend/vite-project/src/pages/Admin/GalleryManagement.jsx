import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdEdit, MdDelete, MdDragIndicator, MdAdd, MdCloudUpload, MdKeyboardArrowDown } from "react-icons/md";
import {getCategories,getDesigns,createCategory,updateCategory,deleteCategory,createDesign,updateDesign,
    deleteDesign,} 
from "../../services/galleryService";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";


function GalleryManagement() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Category state
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState(null);
    const [submittingCategory, setSubmittingCategory] = useState(false);
    
    // Design state
    const [showDesignModal, setShowDesignModal] = useState(false);
    const [editingDesign, setEditingDesign] = useState(null);
    const [designName, setDesignName] = useState("");
    const [description, setDescription] = useState("");
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);

    const [frontPreview, setFrontPreview] = useState("");
    const [backPreview, setBackPreview] = useState("");
    const [designCategory, setDesignCategory] = useState("");
    const [submittingDesign, setSubmittingDesign] = useState(false);
    const [showCategories, setShowCategories] = useState(false);
    const [showDesignCategories, setShowDesignCategories] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const dropdownRef = useRef(null);
    const designDropdownRef = useRef(null);

    useEffect(() => {
    function handleClickOutside(event) {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target)
        ) {
            setShowCategories(false);
        }

        if (designDropdownRef.current && !designDropdownRef.current.contains(event.target)) {
            setShowDesignCategories(false);
        }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener(
            "mousedown",
            handleClickOutside
        );
    };
}, []);

    useEffect(() => {
        loadCategories();
        loadDesigns(selectedCategory, currentPage);
    }, []);

    async function loadCategories() {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            console.log(err);
            toast.error("Failed to load categories");
        }
    }

    async function loadDesigns(categoryId = null, page = 1) {
        try {
            setLoading(true);
            const response = await getDesigns(categoryId, page, 6, true);
            setDesigns(response.data || []);
            setCurrentPage(response.current_page || page);
            setTotalPages(response.total_pages || 1);
        } catch (err) {
            console.log(err);
            toast.error("Failed to load designs");
        } finally {
            setLoading(false);
        }
    }

    function handleFilter(id) {
        setSelectedCategory(id);
        setCurrentPage(1);
        loadDesigns(id, 1);
    }

    /* ================= CATEGORY CRUD ================= */
    function openCategoryPopup() {
        setCategoryName("");
        setEditingCategory(null);
        setShowCategoryModal(true);
    }

    function closeCategoryPopup() {
        setCategoryName("");
        setEditingCategory(null);
        setShowCategoryModal(false);
    }

    async function handleCategorySubmit(e) {
        e.preventDefault();
        if (!categoryName.trim()) {
            toast.error("Category name is required.");
            return;
        }

        setSubmittingCategory(true);
        try {
            if (editingCategory) {
                await updateCategory({
                    category_ids: [editingCategory.id],
                    name: categoryName,
                });
                toast.success("Category updated successfully.");
            } else {
                await createCategory({ name: categoryName });
                toast.success("Category added successfully.");
            }
            setCategoryName("");
            setEditingCategory(null);
            await refreshGallery();
        } catch (err) {
            console.log(err);
            toast.error("Failed to save category.");
        } finally {
            setSubmittingCategory(false);
        }
    }

    function editCategory(category) {
        setEditingCategory(category);
        setCategoryName(category.name);
        setShowCategoryModal(true);
    }

    async function removeCategory(id) {
        try {
            await deleteCategory([id]);
            toast.success("Category deleted successfully.");
            await refreshGallery();
        } catch (err) {
            console.log(err);
            toast.error("Unable to delete category.");
        }
    }

    /* ================= DESIGN CRUD ================= */
    function openDesignPopup() {
        setEditingDesign(null);
        setDesignName("");
        setDescription("");
        setDesignCategory("");
        setFrontImage(null);
        setBackImage(null);
        setFrontPreview("");
        setBackPreview("");
        setShowDesignCategories(false);
        setShowDesignModal(true);
    }

    function closeDesignPopup() {
        setEditingDesign(null);
        setDesignName("");
        setDescription("");
        setFrontImage(null);
        setBackImage(null);
        setFrontPreview("");
        setBackPreview("");
        setDesignCategory("");
        setShowDesignCategories(false);
        setShowDesignModal(false);
    }

    async function handleDesignSubmit(e) {
        e.preventDefault();
        setSubmittingDesign(true);
        try {
            const formData = new FormData();
            formData.append("category", designCategory);
            formData.append("design_name", designName);
            formData.append("description", description);
            if (frontImage) formData.append("front_image", frontImage);
            if (backImage) formData.append("back_image", backImage);

            if (editingDesign) {
                await updateDesign(editingDesign.id, formData);
                toast.success("Design updated successfully.");
            } else {
                await createDesign(formData);
                toast.success("Design added successfully.");
            }
            closeDesignPopup();
            await refreshGallery();
        } catch (err) {
            console.log(err);
            toast.error("Unable to save design.");
        } finally {
            setSubmittingDesign(false);
        }
    }

    function editDesign(design) {
        setEditingDesign(design);
        setDesignName(design.design_name);
        setDescription(design.description || "");
        setDesignCategory(design.category);
        setFrontPreview(design.front_image_url);
        setBackPreview(design.back_image_url);
        setFrontImage(null);
        setBackImage(null);
        setShowDesignCategories(false);
        setShowDesignModal(true);
    }

    async function removeDesign(id) {
        try {
            await deleteDesign(id);
            toast.success("Design deleted successfully.");
            await refreshGallery();
        } catch (err) {
            console.log(err);
            toast.error("Unable to delete design.");
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        const { id, type } = deleteTarget;
        setDeleteTarget(null);
        if (type === "category") await removeCategory(id);
        else await removeDesign(id);
    }

    async function refreshGallery() {
        await loadCategories();
        await loadDesigns(selectedCategory, currentPage);
    }

    return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1 text-dark [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h1 className="font-heading text-2xl font-bold">
                    Gallery Management
                </h1>

                <p className="mt-1 text-sm text-secondary">
                    Manage categories and designs from a single place.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={openDesignPopup}
                    className="h-10 w-full min-w-40 justify-center rounded-xl border border-primary/20 px-4 font-heading shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-40">
                    <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <MdAdd size={18} className="shrink-0" />
                        <span>Add Design</span>
                    </span>
                </Button>

                <Button
                    variant="primary"
                    size="sm"
                    onClick={openCategoryPopup}
                    className="h-10 w-full min-w-40 justify-center rounded-xl border border-primary/20 px-4 font-heading shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-40">

                    <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <MdAdd size={18} className="shrink-0" />
                        <span>Add Category</span>
                    </span>
                </Button>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <div ref={dropdownRef} className="relative w-full sm:w-[220px]">
                    <button
                        type="button"
                        onClick={() => setShowCategories(!showCategories)}
                        className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-surface px-3 text-sm text-dark shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                        <span className="flex-1 truncate text-left">
                            {selectedCategory
                                ? categories.find(
                                    (category) => category.id === selectedCategory
                                )?.name
                                : "All Categories"}
                        </span>

                        <MdKeyboardArrowDown
                            size={20}
                            className={`transition-transform ${
                                showCategories ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {showCategories && (
                        <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                            <div className="max-h-[260px] overflow-y-auto
                                    [&::-webkit-scrollbar]:w-1.5
                                    [&::-webkit-scrollbar-track]:bg-transparent
                                    [&::-webkit-scrollbar-thumb]:rounded-full
                                    [&::-webkit-scrollbar-thumb]:bg-border
                                    hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleFilter(null);
                                        setShowCategories(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-dark transition-colors hover:bg-background"
                                >
                                    All Categories
                                </button>

                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => {
                                            handleFilter(category.id);
                                            setShowCategories(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-dark transition-colors hover:bg-background"
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
            </div>
        </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {loading ? (
                                Array.from({ length: 8 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm"
                                    >
                                        <div className="mb-4 h-48 animate-pulse rounded-xl bg-border/50" />

                                        <div className="space-y-2">
                                            <div className="h-4 w-3/4 animate-pulse rounded bg-border/50" />

                                            <div className="h-3 w-1/2 animate-pulse rounded bg-border/50" />
                                        </div>
                                    </div>
                                ))
                    ) : (
                        designs.map((design) => (
<div
    key={design.id}
    className="overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
>
    <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="overflow-hidden rounded-xl border border-border bg-background">
            <img
                src={design.front_image_url}
                alt="Front"
                className="aspect-square h-full w-full object-contain"
            />

            <div className="border-t border-border px-3 py-2 text-center text-xs font-medium text-secondary">
                Front
            </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background">
                {design.back_image_url && (
                    <img
                        src={design.back_image_url}
                        alt="Back"
                        className="aspect-square h-full w-full object-contain"
                    />
                )}

            <div className="border-t border-border px-3 py-2 text-center text-xs font-medium text-secondary">
                Back
            </div>
        </div>
    </div>

    <div className="space-y-2">
        <h3 className="truncate text-base font-bold text-dark">
            {design.design_name}
        </h3>

        <p className="font-body text-sm text-secondary">
            {design.category_name}
        </p>
    </div>

    <div className="mt-5 flex items-center justify-between gap-2">
<Button
    variant="secondary"
    size="sm"
    onClick={() => editDesign(design)}
    className="h-9 min-w-[44px] sm:min-w-[90px] flex-1 rounded-lg px-3"
>
    <MdEdit className="shrink-0" size={16} />
    <span className="hidden sm:inline">Edit</span>
</Button>

        <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget({ id: design.id, type: "design", name: design.design_name })}
            className="h-9 w-9 shrink-0 rounded-lg p-0"
        >
            <MdDelete size={16} />
        </Button>
    </div>
</div>
                        ))
                    )}
                </div>
                <div className="flex items-center justify-between gap-3">
    <p className="font-heading text-sm font-semibold text-secondary">Page {currentPage} of {totalPages}</p>
    <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => loadDesigns(selectedCategory, currentPage - 1)} className="h-9 rounded-lg px-4 font-heading">Previous</Button>
        <Button type="button" variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => loadDesigns(selectedCategory, currentPage + 1)} className="h-9 rounded-lg px-4 font-heading">Next</Button>
    </div>
</div>
            </div>

            {/* Modals */}
<Modal
    isOpen={showCategoryModal}
    onClose={closeCategoryPopup}
    title={editingCategory ? "Edit Category" : "Add Category"}
    width="400px"
>
    <form
        onSubmit={handleCategorySubmit}
        className="space-y-5"
    >
        <div className="space-y-2">
            <label className="font-heading text-sm font-semibold text-dark">
                Category Name
            </label>

            <input
                id="new-category-input"
                type="text"
                value={categoryName}
                placeholder={
                    editingCategory
                        ? "Enter category name"
                        : "Enter a new category"
                }
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-border bg-surface px-4 font-body text-sm leading-5 text-dark shadow-sm outline-none transition-colors placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
        </div>

        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-secondary">
                Existing Categories
            </h3>

            <div
                className="
                    max-h-[250px]
                    space-y-2
                    overflow-y-auto
                    pr-1
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-border
                    hover:[&::-webkit-scrollbar-thumb]:bg-primary/50
                "
            >
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
                    >
                        <div className="flex items-center gap-2">

                            <MdDragIndicator size={18} className="text-secondary" />
                            <span className="text-sm font-medium">
                                {category.name}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => editCategory(category)}
                                className="h-8 w-8 shrink-0 rounded-lg p-0"
                            >
                                <MdEdit size={16} />
                            </Button>

                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteTarget({ id: category.id, type: "category", name: category.name })}
                                className="h-8 w-8 shrink-0 rounded-lg p-0"
                            >
                                <MdDelete size={16} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
            <Button
                type="button"
                variant="secondary"
                onClick={closeCategoryPopup}
                className="h-10 px-4"
            >
                Cancel
            </Button>

            <Button
                type="submit"
                variant="primary"
                isLoading={submittingCategory}
                className="h-10 px-4"
            >
                {editingCategory
                    ? "Update Category"
                    : "Add Category"}
            </Button>
        </div>
    </form>
</Modal>

            <Modal
                isOpen={showDesignModal}
                onClose={closeDesignPopup}
                title={editingDesign ? "Edit Design" : "Add Design"}
            >
                <form onSubmit={handleDesignSubmit} className="space-y-5">
<div className="space-y-2">
    <label
        htmlFor="design-category"
        className="font-heading text-sm font-semibold text-dark"
    >
        Category
    </label>

<div ref={designDropdownRef} className="relative">
    <button
        id="design-category"
        type="button"
        onClick={() => setShowDesignCategories((open) => !open)}
        aria-expanded={showDesignCategories}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 font-body text-sm leading-5 text-dark shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    >
        <span className={`min-w-0 flex-1 truncate text-left ${designCategory ? "text-dark" : "text-secondary"}`}>
            {categories.find((category) => String(category.id) === String(designCategory))?.name || "Select Category"}
        </span>
        <MdKeyboardArrowDown
            size={20}
            className={`shrink-0 text-secondary transition-transform duration-200 ${showDesignCategories ? "rotate-180" : ""}`}
        />
    </button>

    {showDesignCategories && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <div className="max-h-44 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                            setDesignCategory(String(category.id));
                            setShowDesignCategories(false);
                        }}
                        className={`flex min-h-11 w-full items-center px-4 py-2 text-left font-body text-sm leading-5 transition-colors hover:bg-background ${String(category.id) === String(designCategory) ? "bg-primary/10 text-primary" : "text-dark"}`}
                    >
                        <span className="break-words">{category.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )}
</div>
</div>

<div className="space-y-2">
    <label
        htmlFor="design-name"
        className="font-heading text-sm font-semibold text-dark"
    >
        Design Name
    </label>

    <input
        id="design-name"
        type="text"
        placeholder="Enter design name"
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
        required
        className="h-11 w-full rounded-xl border border-border bg-surface px-4 font-body text-sm leading-5 text-dark shadow-sm outline-none transition-colors placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
</div>

<div className="space-y-2">
    <label
        htmlFor="design-description"
        className="font-heading text-sm font-semibold text-dark"
    >
        Description
    </label>

    <textarea
        id="design-description"
        rows={4}
        value={description}
        placeholder="Enter description"
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-28 w-full resize-y rounded-xl border border-border bg-surface p-4 font-body text-sm leading-5 text-dark shadow-sm outline-none transition-colors placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
</div>

<div className="space-y-2">
    <label className="font-heading text-sm font-semibold text-dark">
        Front Image
    </label>

    <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background p-5 transition-colors hover:border-primary hover:bg-primary/5">
        <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
                const file = e.target.files[0];

                setFrontImage(file);

                if (file) {
                    setFrontPreview(
                        URL.createObjectURL(file)
                    );
                }
            }}
        />

        {frontPreview ? (
            <img
                src={frontPreview}
                alt="Front preview"
                className="max-h-[220px] rounded-xl object-contain"
            />
        ) : (
            <>
                <MdCloudUpload
                    size={36}
                    className="text-primary"
                />

                <p className="mt-3 text-sm text-secondary">
                    Upload front image
                </p>
            </>
        )}
    </label>
</div>

<div className="space-y-2">
    <label className="font-heading text-sm font-semibold text-dark">
        Back Image
    </label>

    <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background p-5 transition-colors hover:border-primary hover:bg-primary/5">
        <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
                const file = e.target.files[0];

                setBackImage(file);

                if (file) {
                    setBackPreview(
                        URL.createObjectURL(file)
                    );
                }
            }}
        />

        {backPreview ? (
            <img
                src={backPreview}
                alt="Back preview"
                className="max-h-[220px] rounded-xl object-contain"
            />
        ) : (
            <>
                <MdCloudUpload
                    size={36}
                    className="text-primary"
                />

                <p className="mt-3 text-sm text-secondary">
                    Upload back image
                </p>
            </>
        )}
    </label>
</div>



                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" className="h-10 px-4" onClick={closeDesignPopup}>Cancel</Button>
                        <Button type="submit" variant="primary"  className="h-10 px-4" isLoading={submittingDesign}>
                            {editingDesign ? "Update Design" : "Add Design"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                title={`Delete ${deleteTarget?.type || "item"}`}
                width="400px"
            >
                <div className="space-y-6">
                    <p className="text-sm leading-6 text-secondary">
                        Are you sure you want to delete <span className="font-semibold text-dark">{deleteTarget?.name}</span>? This action cannot be undone.
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} className="h-10 rounded-xl px-4">Cancel</Button>
                        <Button type="button" variant="danger" onClick={confirmDelete} className="h-10 rounded-xl px-4">Delete</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default GalleryManagement;