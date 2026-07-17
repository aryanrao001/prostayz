import React, { useEffect, useState } from 'react';
import { Loader2, Plus, LayoutGrid, Sparkles, ChevronLeft, ChevronRight, MapPin, Star, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// --- MAIN COMPONENT ---
const Hotels = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/vendor/properties`, { withCredentials: true });
                setProperties(response.data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <div className="w-12 h-12 border-4 border-[#F5F2EA] border-t-[#C99A3D] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-display text-[#1E2A23] mb-2 tracking-tight">Your Portfolio</h1>
                    <p className="text-[#9A917D] flex items-center gap-2">
                        <Sparkles size={14} className="text-[#C99A3D]" />
                        Managing {properties.length} active units
                    </p>
                </div>
                <Link to="/vendor/newlist">
                    <button className="flex items-center justify-center gap-2 bg-[#1E2A23] text-white px-8 py-3.5 rounded-2xl font-medium hover:bg-[#C99A3D] transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus size={18} /> Add Property
                    </button>
                </Link>

            </div>

            <div className="grid grid-cols-1 gap-8">
                {properties.map((prop) => (
                    <PropertyDetailedCard key={prop.id} property={prop} />
                ))}
            </div>
        </div>
    );
};

// --- DETAILED CARD COMPONENT ---
const PropertyDetailedCard = ({ property }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const images = property.preview_images || [];

    return (
        <div className="group bg-white border border-[#E5DECF] rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:border-[#C99A3D]/30 overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Sleek Image Carousel */}
                <div className="relative w-full lg:w-[420px] h-[300px] rounded-3xl overflow-hidden bg-[#F5F2EA] flex-shrink-0 shadow-inner">
                    {images.length > 0 ? (
                        <>
                            <img
                                src={`${backendUrl}/uploads/properties/${property.id}/${images[currentIdx].image}`}
                                alt="Property"
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                            />
                            {images.length > 1 && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-[#DBD3C4]"><ImageIcon size={64} strokeWidth={1} /></div>
                    )}
                </div>

                {/* Dynamic Content */}
                <div className="flex flex-col justify-between flex-1 py-1">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-display text-3xl text-[#1E2A23]">{property.property_name}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border ${property.status === 'live' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#F5F2EA] text-[#6B6354] border-[#E5DECF]'}`}>
                                {property.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-[#9A917D] mb-6 text-sm">
                            <span className="flex items-center gap-1.5 bg-[#F8F7F3] px-3 py-1 rounded-lg"><MapPin size={14} /> {property.city}</span>
                            <span className="flex items-center gap-1.5 bg-[#F8F7F3] px-3 py-1 rounded-lg"><Star size={14} className="text-[#C99A3D]" /> {property.star_rating} Rating</span>
                        </div>

                        <p className="text-[#6B6354] text-base leading-relaxed line-clamp-3">{property.description}</p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-[#F5F2EA] pt-6">
                        <div className="flex gap-8">
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] uppercase text-[#9A917D] tracking-widest mb-1">Nightly</p>
                                <p className="text-xl font-semibold text-[#1E2A23]">₹{property.min_price}</p>
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] uppercase text-[#9A917D] tracking-widest mb-1">Rooms</p>
                                <p className="text-xl font-semibold text-[#1E2A23]">{property.total_rooms}</p>
                            </div>
                        </div>
                        <Link to={`/vendor/listingdetails/${property.id}`} >
                            <button className="hidden sm:flex items-center gap-2 text-[#2F6F62] font-semibold text-sm hover:underline">
                                Listing <ChevronRight size={16} />
                            </button>
                        </Link>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hotels;


