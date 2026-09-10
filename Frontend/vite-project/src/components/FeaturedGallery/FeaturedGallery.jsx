import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../services/galleryService";

export default function FeaturedGallery() {

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function fetchCategories() {

            try {

                const data = await getCategories();
                setCategories(data.slice(0, 3));

            } catch (error) {

                console.log(error);

            } finally {

                setLoading(false);

            }

        }

        fetchCategories();

    }, []);

    if (loading) {

        return (
            <section className="bg-surface py-20">
                <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
                    <h2 className="text-center text-3xl md:text-4xl font-extrabold text-dark mb-12 font-heading">
                        Featured Designs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div className="bg-background border border-border rounded-card overflow-hidden shadow-xs animate-pulse" key={i}>
                                <div className="w-full h-[280px] bg-border/40" />
                                <div className="h-6 w-3/5 m-6 bg-border/40 rounded-sm" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );

    }

    if (categories.length === 0) return null;

    return (
        <section className="bg-surface py-20">
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">

                <h2 className="text-center text-3xl md:text-4xl font-extrabold text-dark mb-12 font-heading">
                    Featured Designs
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {categories.map((cat) => (
                        <div className="bg-background border border-border rounded-card overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-2 flex flex-col" key={cat.id}>

                            {cat.first_image ? (
                                <div className="overflow-hidden h-[280px]">
                                    <img 
                                        src={cat.first_image} 
                                        alt={cat.name} 
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-[280px] flex items-center justify-center bg-background text-secondary text-base border-b border-border font-medium">
                                    No Image
                                </div>
                            )}

                            <h3 className="px-6 py-4 text-xl font-bold text-dark font-heading flex-grow">
                                {cat.name}
                            </h3>

                            <Link
                                to={`/gallery?category=${cat.id}`}
                                className="block mx-6 mb-6 text-center py-2.5 bg-primary hover:bg-primary-hover text-surface font-semibold rounded-button transition-colors duration-200 cursor-pointer"
                            >
                                View
                            </Link>

                        </div>
                    ))}

                </div>

                <Link to="/gallery" className="block w-56 mx-auto mt-12 text-center py-3.5 bg-transparent border-2 border-border text-dark hover:bg-secondary hover:border-primary hover:text-surface font-semibold rounded-button transition-all duration-200 cursor-pointer">
                    View Complete Gallery
                </Link>
            </div>
        </section>
    );
}