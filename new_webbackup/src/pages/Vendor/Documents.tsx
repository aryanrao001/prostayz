import React, { useRef, useState } from "react";
import {
    ArrowLeft,
    Upload,
    FileText,
    ImageIcon,
    CheckCircle2,
    X,
    ShieldCheck,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface DocumentItem {
    title: string;
    description: string;
    field: string;
    file: File | null;
}

const Documents = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL as string;

    const [loading, setLoading] = useState(false);

    const [documents, setDocuments] = useState<DocumentItem[]>([
        {
            title: "Business Registration",
            description:
                "Articles of Incorporation or Company Registration Certificate",
            field: "business_registration",
            file: null,
        },
        {
            title: "Ownership Proof",
            description: "Property Deed or Lease Agreement",
            field: "ownership_proof",
            file: null,
        },
        {
            title: "Ultimate Beneficial Ownership",
            description: "List of Directors / Shareholders",
            field: "ubo",
            file: null,
        },
        {
            title: "PAN Card",
            description: "Government Issued PAN Card",
            field: "pan_card",
            file: null,
        },
        {
            title: "GST Registration",
            description: "GST Registration Certificate",
            field: "gst_certificate",
            file: null,
        },
        {
            title: "Government ID",
            description: "Passport / Driving Licence / Aadhaar",
            field: "government_id",
            file: null,
        },
    ]);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const validateFile = (file: File) => {
        const allowed = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/jpg",
        ];
        if (!allowed.includes(file.type)) {
            toast.error("Only PDF, JPG and PNG files are allowed.");
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Maximum file size is 10 MB.");
            return false;
        }
        return true;
    };

    const updateFile = (index: number, file: File) => {
        if (!validateFile(file)) return;
        setDocuments((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], file };
            return copy;
        });
    };

    const onInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        index: number
    ) => {
        if (!e.target.files?.length) return;
        updateFile(index, e.target.files[0]);
    };

    const removeFile = (index: number) => {
        setDocuments((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], file: null };
            return copy;
        });
        if (inputRefs.current[index]) {
            inputRefs.current[index]!.value = "";
        }
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (!e.dataTransfer.files.length) return;
        updateFile(index, e.dataTransfer.files[0]);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const uploadDocuments = async () => {
        const propertyId = localStorage.getItem("property_id");
        if (!propertyId) {
            toast.error("Property not found.");
            return;
        }
        const missing = documents.find((doc) => !doc.file);
        if (missing) {
            toast.error(`${missing.title} is required.`);
            return;
        }
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("property_id", propertyId);
            documents.forEach((doc) => {
                if (doc.file) {
                    formData.append(doc.field, doc.file);
                }
            });
            await axios.post(
                `${backendUrl}/api/vendor/documents/upload`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            toast.success("Documents uploaded successfully.");
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Upload failed."
            );
        } finally {
            setLoading(false);
        }
    };

    // Single upload card — renders one document's dropzone / preview
    const UploadCard = ({
        item,
        index,
    }: {
        item: DocumentItem;
        index: number;
    }) => {
        const isImage = item.file?.type.startsWith("image/");

        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {item.description}
                        </p>
                    </div>
                    {item.file && (
                        <CheckCircle2
                            size={22}
                            className="text-emerald-600 shrink-0"
                        />
                    )}
                </div>

                <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => onInputChange(e, index)}
                />

                {!item.file ? (
                    <div
                        onDrop={(e) => onDrop(e, index)}
                        onDragOver={onDragOver}
                        onClick={() => inputRefs.current[index]?.click()}
                        className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-10 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition"
                    >
                        <Upload size={28} className="text-gray-400" />
                        <p className="text-sm text-gray-500">
                            Drag & drop or{" "}
                            <span className="text-emerald-600 font-medium">
                                browse
                            </span>
                        </p>
                        <p className="text-xs text-gray-400">
                            PDF, JPG, PNG up to 10 MB
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            {isImage ? (
                                <ImageIcon
                                    size={20}
                                    className="text-emerald-600 shrink-0"
                                />
                            ) : (
                                <FileText
                                    size={20}
                                    className="text-emerald-600 shrink-0"
                                />
                            )}
                            <span className="text-sm text-gray-700 truncate">
                                {item.file.name}
                            </span>
                        </div>
                        <button
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-red-500 transition shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F6F2] via-white to-[#EEF7F4]">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-black transition">
                        <ArrowLeft size={18} />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="mt-5">
                        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
                            Step 3 of 3
                        </p>
                        <h1 className="mt-2 text-4xl font-bold text-gray-900">
                            Verify Your Business
                        </h1>
                        <p className="mt-3 text-gray-500 max-w-3xl">
                            Upload the required documents to verify your
                            business and property. This usually takes less
                            than <span className="font-semibold">24 hours</span>.
                        </p>
                    </div>
                    <div className="mt-6">
                        <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                                style={{ width: "100%" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid lg:grid-cols-2 gap-8">
                    {documents.map((item, index) => (
                        <UploadCard key={item.field} item={item} index={index} />
                    ))}
                </div>

                {/* Tips */}
                <div className="mt-10 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <ShieldCheck
                            size={32}
                            className="text-emerald-600 mt-1"
                        />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Before you submit
                            </h2>
                            <ul className="mt-4 space-y-3 text-gray-600">
                                <li>• Upload clear and readable scans.</li>
                                <li>• Images should not be cropped.</li>
                                <li>• Ensure all information is visible.</li>
                                <li>• Maximum size per file is 10 MB.</li>
                                <li>
                                    • Accepted formats: PDF, JPG, JPEG and PNG.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-5">
                    <div>
                        <p className="font-semibold text-gray-900">
                            Security & Privacy
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            Your documents are encrypted and securely stored.
                            They are only used for verification purposes.
                        </p>
                    </div>

                    <button
                        onClick={uploadDocuments}
                        disabled={loading}
                        className="px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <svg
                                    className="animate-spin h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        opacity="0.25"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                                Uploading...
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={22} />
                                Submit Documents
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Documents;