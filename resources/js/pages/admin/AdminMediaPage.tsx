import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { MediaItem } from '../../types';
import {
    Image as ImageIcon,
    UploadCloud,
    Search,
    Copy,
    Check,
    Trash2,
    ExternalLink,
    Filter,
    FileText,
    Video,
    Music,
    File,
    Loader2,
    RefreshCw,
    X,
    Eye
} from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [deleteModalItem, setDeleteModalItem] = useState<MediaItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchMedia = async (pageNumber = 1, searchQuery = search, type = filterType) => {
        setLoading(true);
        try {
            const params: any = { page: pageNumber, per_page: 24 };
            if (searchQuery) params.search = searchQuery;
            if (type && type !== 'all') params.type = type;

            const res = await apiClient.get('/admin/media', { params });
            if (res.data && res.data.data) {
                setMediaItems(res.data.data);
                setPage(res.data.current_page || 1);
                setLastPage(res.data.last_page || 1);
                setTotalItems(res.data.total || 0);
            }
        } catch (err: any) {
            console.error('Failed to load media', err);
            showToast('Failed to load media files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia(1, search, filterType);
    }, [filterType]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMedia(1, search, filterType);
    };

    const handleUploadFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);

            try {
                await apiClient.post('/admin/media', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                successCount++;
            } catch (err) {
                failCount++;
            }
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (successCount > 0) {
            showToast(`${successCount} file(s) uploaded successfully`);
            fetchMedia(1, search, filterType);
        }
        if (failCount > 0) {
            showToast(`${failCount} file(s) failed to upload`);
        }
    };

    const handleCopyUrl = (item: MediaItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(item.url);
        setCopiedId(item.id);
        showToast('File link copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async () => {
        if (!deleteModalItem) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/admin/media/${deleteModalItem.id}`);
            showToast('File deleted successfully');
            setMediaItems(prev => prev.filter(item => item.id !== deleteModalItem.id));
            if (selectedItem?.id === deleteModalItem.id) {
                setSelectedItem(null);
            }
            setDeleteModalItem(null);
            setTotalItems(prev => Math.max(0, prev - 1));
        } catch (err) {
            showToast('Failed to delete file');
        } finally {
            setDeleting(false);
        }
    };

    const renderThumbnail = (item: MediaItem) => {
        if (item.file_type === 'image') {
            return (
                <img
                    src={item.url}
                    alt={item.file_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
            );
        }
        if (item.file_type === 'video') {
            return <Video className="w-12 h-12 text-rose-500" />;
        }
        if (item.file_type === 'audio') {
            return <Music className="w-12 h-12 text-emerald-500" />;
        }
        if (item.file_type === 'document') {
            return <FileText className="w-12 h-12 text-blue-500" />;
        }
        return <File className="w-12 h-12 text-slate-400" />;
    };

    return (
        <div className="space-y-6">
            {/* Toast notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUploadFiles(e.target.files)}
            />

            {/* Header & Upload Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Media Library</h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                All course thumbnails, banners, materials, and uploaded website files
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4" />
                                <span>Upload New File</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Type Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {[
                        { label: 'All Files', value: 'all' },
                        { label: 'Images', value: 'image' },
                        { label: 'Documents', value: 'document' },
                        { label: 'Videos', value: 'video' },
                        { label: 'Audio', value: 'audio' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterType(tab.value)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filterType === tab.value
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by file name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                        />
                    </form>

                    <button
                        type="button"
                        onClick={() => fetchMedia(page, search, filterType)}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Drop Zone Area for quick drag-drop */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    handleUploadFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/20 rounded-2xl p-6 text-center bg-white/60 transition cursor-pointer flex flex-col items-center justify-center group"
            >
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-sky-600 group-hover:scale-110 transition mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                    Drag and drop any file here, or click to browse
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports images, PDFs, videos, audio files (max 50 MB per file)
                </p>
            </div>

            {/* Main Content: Media Grid */}
            {loading && mediaItems.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                    <Loader2 className="w-10 h-10 animate-spin text-sky-600 mb-3" />
                    <p className="text-sm font-medium text-slate-600">Loading media library...</p>
                </div>
            ) : mediaItems.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No files found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Click the "Upload New File" button above to upload your first file.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {mediaItems.map((item) => {
                        const isCopied = copiedId === item.id;
                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
                            >
                                {/* Media Thumbnail Container */}
                                <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                    {renderThumbnail(item)}

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={(e) => handleCopyUrl(item, e)}
                                            className="p-2 bg-white text-slate-700 hover:text-sky-600 rounded-lg shadow-md hover:scale-105 transition"
                                            title="Copy Link"
                                        >
                                            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2 bg-white text-slate-700 hover:text-sky-600 rounded-lg shadow-md hover:scale-105 transition"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteModalItem(item);
                                            }}
                                            className="p-2 bg-white text-rose-600 hover:bg-rose-50 rounded-lg shadow-md hover:scale-105 transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Meta details */}
                                <div className="p-2.5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800 truncate" title={item.file_name}>
                                            {item.file_name}
                                        </p>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                            <span>{item.formatted_size || `${Math.round(item.file_size / 1024)} KB`}</span>
                                            <span className="uppercase font-semibold tracking-wider text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                                {item.file_type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Copy Link Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleCopyUrl(item, e)}
                                        className={`mt-2.5 w-full py-1 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition ${isCopied
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200'
                                            }`}
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span>Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copy Link</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">
                        Total {totalItems} media files (Page {page} of {lastPage})
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => fetchMedia(page - 1, search, filterType)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= lastPage}
                            onClick={() => fetchMedia(page + 1, search, filterType)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Media Details Sidebar / Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">File Details</h3>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Preview */}
                            <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200">
                                {selectedItem.file_type === 'image' ? (
                                    <img
                                        src={selectedItem.url}
                                        alt={selectedItem.file_name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    renderThumbnail(selectedItem)
                                )}
                            </div>

                            {/* Details table */}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">File Name</span>
                                    <span className="font-semibold text-slate-700 break-all">{selectedItem.file_name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">File Size</span>
                                    <span className="font-semibold text-slate-700">{selectedItem.formatted_size}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">File Type</span>
                                    <span className="font-semibold text-slate-700 uppercase">{selectedItem.file_type} ({selectedItem.mime_type})</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Upload Date</span>
                                    <span className="font-semibold text-slate-700">
                                        {new Date(selectedItem.created_at).toLocaleDateString('en-US')}
                                    </span>
                                </div>
                            </div>

                            {/* Public URL field */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Public URL
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedItem.url}
                                        className="flex-1 text-xs bg-slate-100 text-slate-600 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCopyUrl(selectedItem)}
                                        className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteModalItem(selectedItem);
                                }}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete File</span>
                            </button>
                            <a
                                href={selectedItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Full View</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Are you sure?</h3>
                        <p className="text-xs text-slate-500 mt-1.5">
                            "{deleteModalItem.file_name}" will be permanently deleted and will no longer appear where it was used.
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setDeleteModalItem(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                            >
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                <span>Yes, Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};