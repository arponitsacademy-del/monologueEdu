import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { MediaItem } from '../../types';
import {
    X,
    UploadCloud,
    Search,
    Check,
    Image as ImageIcon,
    FileText,
    Video,
    Music,
    File,
    Loader2,
    RefreshCw
} from 'lucide-react';

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, item?: MediaItem) => void;
    filterType?: 'image' | 'document' | 'video' | 'all';
    title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    filterType = 'image',
    title = 'Select image or file from media library'
}) => {
    const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchMedia(1, searchTerm);
            setSelectedItem(null);
            setUploadError(null);
        }
    }, [isOpen, filterType]);

    const fetchMedia = async (pageNumber = 1, search = '') => {
        setLoading(true);
        try {
            const params: any = { page: pageNumber, per_page: 24 };
            if (filterType && filterType !== 'all') {
                params.type = filterType;
            }
            if (search) {
                params.search = search;
            }
            const res = await apiClient.get('/admin/media', { params });
            if (res.data && res.data.data) {
                setItems(res.data.data);
                setPage(res.data.current_page || 1);
                setLastPage(res.data.last_page || 1);
            }
        } catch (err: any) {
            console.error('Failed to load media items', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMedia(1, searchTerm);
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setUploadError(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await apiClient.post('/admin/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newMedia = res.data.media;
            // Prepend new media to list
            setItems(prev => [newMedia, ...prev]);
            setSelectedItem(newMedia);
            setActiveTab('library');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to upload file. Please try again.';
            setUploadError(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleConfirm = () => {
        if (selectedItem) {
            onSelect(selectedItem.url, selectedItem);
            onClose();
        }
    };

    const renderFilePreview = (item: MediaItem) => {
        if (item.file_type === 'image') {
            return (
                <img
                    src={item.url}
                    alt={item.file_name}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                    onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
            );
        }
        if (item.file_type === 'video') {
            return <Video className="w-10 h-10 text-rose-500" />;
        }
        if (item.file_type === 'audio') {
            return <Music className="w-10 h-10 text-emerald-500" />;
        }
        if (item.file_type === 'document') {
            return <FileText className="w-10 h-10 text-blue-500" />;
        }
        return <File className="w-10 h-10 text-slate-400" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Select an image or upload a new one from your device
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'library'
                                ? 'border-sky-600 text-sky-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Media Library
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'upload'
                                ? 'border-sky-600 text-sky-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Upload New
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {activeTab === 'upload' ? (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white hover:border-sky-500 hover:bg-sky-50/20 transition flex flex-col items-center justify-center cursor-pointer min-h-[320px]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={filterType === 'image' ? 'image/*' : '*/*'}
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileUpload(e.target.files[0]);
                                    }
                                }}
                            />

                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-12 h-12 text-sky-600 animate-spin mb-4" />
                                    <p className="font-semibold text-slate-700 text-base">Uploading file...</p>
                                    <p className="text-xs text-slate-400 mt-1">Please wait a few moments</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 shadow-inner">
                                        <UploadCloud className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-base mb-1">
                                        Drag & drop files here or browse
                                    </h4>
                                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                                        PNG, JPG, WEBP, SVG files supported (max 50 MB)
                                    </p>
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm">
                                        Choose from computer
                                    </span>
                                </>
                            )}

                            {uploadError && (
                                <p className="mt-4 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                                    {uploadError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Search & Actions Bar */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center justify-between">
                                <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by file name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                    />
                                </form>

                                <button
                                    type="button"
                                    onClick={() => fetchMedia(page, searchTerm)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>

                            {/* Media Grid */}
                            {loading && items.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
                                    <p className="text-xs">Loading media files...</p>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
                                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-600 text-sm">No media files found</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Add images or files using the "Upload New" tab above
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {items.map((item) => {
                                        const isSelected = selectedItem?.id === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                onDoubleClick={() => {
                                                    setSelectedItem(item);
                                                    onSelect(item.url, item);
                                                    onClose();
                                                }}
                                                className={`group relative rounded-xl border p-1.5 bg-white cursor-pointer transition-all hover:shadow-md flex flex-col ${
                                                    isSelected
                                                        ? 'border-sky-600 ring-2 ring-sky-500/20 shadow-md bg-sky-50/10'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                                                    {renderFilePreview(item)}
                                                    {isSelected && (
                                                        <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center shadow">
                                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2 px-1">
                                                    <p className="text-[11px] font-medium text-slate-700 truncate" title={item.file_name}>
                                                        {item.file_name}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 mt-0.5">
                                                        {item.formatted_size || `${Math.round(item.file_size / 1024)} KB`}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {lastPage > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-6">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => fetchMedia(page - 1, searchTerm)}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 bg-white"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-slate-500 font-medium">
                                        Page {page} of {lastPage}
                                    </span>
                                    <button
                                        disabled={page >= lastPage}
                                        onClick={() => fetchMedia(page + 1, searchTerm)}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 bg-white"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
                    <div className="text-xs text-slate-500">
                        {selectedItem ? (
                            <span className="font-medium text-slate-700">
                                Selected: <span className="text-sky-600 font-semibold">{selectedItem.file_name}</span>
                            </span>
                        ) : (
                            <span>Select a file or double-click to choose</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selectedItem}
                            onClick={handleConfirm}
                            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
