import React, { useState } from 'react';
import villa from "../assets/villa.png"
import apartments from "../assets/apartments.png"
import hostels from "../assets/hostels.png"
import luxury from "../assets/luxury.png"
import { useNavigate } from 'react-router-dom';
// --- Types ---
interface Listing {
  id: string;
  image: string;
  title: string;
  priceInfo: string;
  rating: number;
  isGuestFavorite?: boolean;
}

// --- Mock Data ---
const noidaListings: Listing[] = [
  { id: '1', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop', title: 'Apartment in Noida', priceInfo: '₹16,605 for 2 nights', rating: 5.0, isGuestFavorite: true },
  { id: '2', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=400&fit=crop', title: 'Farm stay in Sector 135', priceInfo: '₹26,944 for 2 nights', rating: 5.0 },
  { id: '3', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=400&fit=crop', title: 'Apartment in Noida', priceInfo: '₹14,379 for 2 nights', rating: 5.0, isGuestFavorite: true },
  { id: '4', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=500&h=400&fit=crop', title: 'Farm stay in Noida', priceInfo: '₹35,600 for 2 nights', rating: 5.0 },
  { id: '5', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=400&fit=crop', title: 'Apartment in Sector 75', priceInfo: '₹9,764 for 2 nights', rating: 5.0, isGuestFavorite: true },
];

const dehradunListings: Listing[] = [
  { id: '6', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=500&h=400&fit=crop', title: 'Apartment in Dehradun', priceInfo: '₹7,587 for 2 nights', rating: 4.85, isGuestFavorite: true },
  { id: '7', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=400&fit=crop', title: 'Flat in Dehradun', priceInfo: '₹9,139 for 2 nights', rating: 4.89, isGuestFavorite: true },
  { id: '8', image: 'https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=500&h=400&fit=crop', title: 'Flat in Dehradun', priceInfo: '₹5,998 for 2 nights', rating: 4.75 },
  { id: '9', image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=500&h=400&fit=crop', title: 'Home in Dehradun', priceInfo: '₹13,466 for 2 nights', rating: 4.97, isGuestFavorite: true },
  { id: '10', image: 'https://images.unsplash.com/photo-1528909514045-2f42a5f6e80b?w=500&h=400&fit=crop', title: 'Flat in Dehradun', priceInfo: '₹6,848 for 2 nights', rating: 4.96, isGuestFavorite: true },
];

// --- Core SVGs ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white"><path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"></path></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-6 h-6 fill-black/50 stroke-white stroke-[2px] hover:fill-rose-500 transition"><path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-6.94c-2.8 0-5.46 1.8-6.96 4.38-1.5-2.58-4.16-4.38-6.96-4.38A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"></path></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-3 h-3 fill-current"><path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 25.951l8.625 4.997a1 1 0 0 0 1.482-1.06l-1.965-9.853 7.293-6.565a1 1 0 0 0-.541-1.735l-9.86-1.271-4.127-8.885a1 1 0 0 0-1.814 0z"></path></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

// --- Placeholder for Flat Icons ---
// Use this space to drop in your `<img>` or flat `<svg>` later.
const FlatIconSpace = () => (
  <div className="w-[60px] h-[60px] mb-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
    <span className="text-[10px] text-gray-400 font-medium tracking-wide">ICON</span>
  </div>
);

// --- Components ---

// const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const HostModal = ({ onClose }: { onClose: () => void }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const navigate = useNavigate();

  // Update the icon property to use <img> tags pointing to your local files
  const options = [
    {
      id: 'villa',
      label: 'Villa',
      icon: <img src={villa} alt="Villa" className="w-[80px] h-[80px] mb-4 object-contain drop-shadow-md" />
    },
    {
      id: 'apartments',
      label: 'Apartments',
      icon: <img src={apartments} className="w-[80px] h-[80px] mb-4 object-contain drop-shadow-md" />
    },
    {
      id: 'hostels',
      label: 'Hostels',
      icon: <img src={hostels} alt="Hostels" className="w-[80px] h-[80px] mb-4 object-contain drop-shadow-md" />
    },
    {
      id: 'luxury',
      label: 'Luxury',
      icon: <img src={luxury} className="w-[80px] h-[80px] mb-4 object-contain drop-shadow-md" />
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Modal Container */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[1000px] overflow-hidden animate-fade-in-up m-4">

        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute left-6 p-2 rounded-full hover:bg-gray-100 transition"
          >
            <CloseIcon />
          </button>
          <h2 className="text-[22px] font-bold text-gray-900">What would you like to host?</h2>
        </div>

        {/* Body - Options Grid */}
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {options.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`
                  relative flex flex-col items-center justify-center p-6 h-[240px] rounded-2xl cursor-pointer transition-all duration-200
                  ${selectedOption === option.id
                    ? 'border-[2px] border-gray-900 bg-gray-50 scale-[0.98]'
                    : 'border border-gray-200 hover:border-gray-900 bg-white hover:shadow-md'
                  }
                `}
              >
                {/* Your image renders here automatically */}
                {option.icon}
                <span className="font-semibold text-[17px] text-gray-900">{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            disabled={!selectedOption}
            onClick={() => navigate("/login")}
            className={`
              px-8 py-3.5 rounded-lg font-semibold text-[16px] transition-colors
              ${selectedOption
                ? 'bg-gray-900 text-white hover:bg-black cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
};

const Navbar = ({ onOpenHostModal }: { onOpenHostModal: () => void }) => (
  <header className="border-b-[1px] border-gray-200 sticky top-0 bg-white z-40">
    <div className="flex justify-between items-center px-10 py-4 max-w-[1600px] mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 text-rose-500 font-bold text-xl cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-8 h-8 fill-current"><path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415.001.228c0 4.062-2.877 6.478-6.357 6.478-2.224 0-4.556-1.258-6.709-3.386l-.257-.26-.172-.179h-.011l-.176.185c-2.044 2.1-4.267 3.42-6.414 3.615l-.28.019-.267.006C5.377 31 2.5 28.584 2.5 24.522l.005-.469c.026-.928.23-1.768.83-3.244l.216-.524c.966-2.298 5.05-10.875 6.944-14.596l.651-1.221C12.537 1.963 13.992 1 16 1zm0 2c-1.239 0-2.053.539-2.987 2.21l-.523 1.008c-1.926 3.776-6.06 12.43-7.031 14.692l-.345.836c-.427 1.071-.573 1.655-.605 2.24l-.009.336v.206c0 2.64 1.439 4.478 4.357 4.478 1.782 0 3.867-1.125 5.822-3.14l.738-.795.733-.815.787.871c2 2.155 4.168 3.344 6.079 3.344 2.918 0 4.357-1.838 4.357-4.478l-.004-.265c-.048-.739-.236-1.428-.737-2.673l-.229-.553c-.933-2.175-5.06-10.8-6.993-14.576l-.612-1.144C18.053 3.539 17.239 3 16 3zm0 11.5c2.476 0 5 1.5 5 4.5 0 2.665-2.052 5.568-5 5.568-2.946 0-5-2.903-5-5.568 0-3 2.524-4.5 5-4.5zm0 2c-1.353 0-3 1.01-3 2.5 0 1.558 1.258 3.568 3 3.568 1.745 0 3-2.01 3-3.568 0-1.49-1.647-2.5-3-2.5z"></path></svg>
        <span className="hidden md:block">airbnb</span>
      </div>

      {/* Main Nav */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
        <div className="flex flex-col items-center text-gray-900 border-b-2 border-gray-900 pb-1 cursor-pointer">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Homes
        </div>
        <div className="flex flex-col items-center hover:text-gray-900 transition cursor-pointer">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
          Experiences
        </div>
        <div className="flex flex-col items-center hover:text-gray-900 transition cursor-pointer">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          Services
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <button
          onClick={onOpenHostModal}
          className="hidden md:block cursor-pointer hover:bg-gray-100 py-2 px-4 rounded-full transition font-semibold"
        >
          Become a host
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
        </button>
        <button className="flex items-center gap-2 border border-gray-300 rounded-full py-1.5 px-3 hover:shadow-md transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          <svg className="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
        </button>
      </div>
    </div>
  </header>
);

const SearchBar = () => (
  <div className="flex justify-center mt-6 px-4">
    <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-[0_3px_10px_rgb(0,0,0,0.1)] w-full max-w-[850px] overflow-hidden">
      <div className="flex-1 hover:bg-gray-100 rounded-full py-3 px-6 cursor-pointer transition">
        <div className="text-xs font-semibold text-gray-900">Where</div>
        <div className="text-sm text-gray-500 truncate">Search destinations</div>
      </div>
      <div className="w-[1px] h-8 bg-gray-200"></div>
      <div className="flex-1 hover:bg-gray-100 rounded-full py-3 px-6 cursor-pointer transition">
        <div className="text-xs font-semibold text-gray-900">When</div>
        <div className="text-sm text-gray-500 truncate">Add dates</div>
      </div>
      <div className="w-[1px] h-8 bg-gray-200"></div>
      <div className="flex-[1.2] flex justify-between items-center hover:bg-gray-100 rounded-full py-2 pl-6 pr-2 cursor-pointer transition">
        <div>
          <div className="text-xs font-semibold text-gray-900">Who</div>
          <div className="text-sm text-gray-500 truncate">Add guests</div>
        </div>
        <button className="bg-rose-600 hover:bg-rose-700 p-3.5 rounded-full transition">
          <SearchIcon />
        </button>
      </div>
    </div>
  </div>
);

const ListingCard = ({ listing }: { listing: Listing }) => (
  <div className="flex-none w-[280px] md:w-[320px] snap-start group cursor-pointer relative">
    <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-gray-200 mb-3">
      <img src={listing.image} alt={listing.title} className="object-cover w-full h-full" />
      {listing.isGuestFavorite && (
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[13px] font-semibold text-gray-900 shadow-sm">
          Guest favourite
        </div>
      )}
      <div className="absolute top-3 right-3"><HeartIcon /></div>
    </div>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-[15px] text-gray-900">{listing.title}</h3>
        <p className="text-gray-500 text-[15px] mt-0.5">{listing.priceInfo}</p>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <StarIcon />
        <span className="text-[15px] text-gray-900">{listing.rating}</span>
      </div>
    </div>
  </div>
);

const ListingSection = ({ title, listings }: { title: string, listings: Listing[] }) => (
  <section className="mb-10 w-full max-w-[1600px] mx-auto">
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-[22px] font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
    </div>
  </section>
);

// --- Main Page ---

const EntryPage = () => {
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-rose-500 selection:text-white">

      {/* Navbar receives the function to open the modal */}
      <Navbar onOpenHostModal={() => setIsHostModalOpen(true)} />

      <div className="bg-[#f7f7f7] pb-8 pt-2">
        <SearchBar />
      </div>

      <main className="px-10 py-10">
        <ListingSection title="Popular homes in Noida" listings={noidaListings} />
        <ListingSection title="Available in Dehradun this weekend" listings={dehradunListings} />
      </main>

      {/* Conditionally render the modal overlay */}
      {isHostModalOpen && <HostModal onClose={() => setIsHostModalOpen(false)} />}
    </div>
  );
};

export default EntryPage;