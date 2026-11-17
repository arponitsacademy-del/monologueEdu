import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
    X, 
    RotateCw, 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    Undo2, 
    Redo2, 
    Trash2, 
    Download, 
    Save, 
    Check, 
    XCircle, 
    CheckCircle2, 
    HelpCircle, 
    Star, 
    Type, 
    Pen, 
    Highlighter, 
    Square, 
    Circle, 
    Palette, 
    Loader2, 
    Eye,
    MessageSquare,
    Sliders
} from 'lucide-react';

export interface KhataAnnotationResult {
    annotatedBlob: Blob;
    dataUrl: string;
    marks?: number;
    feedback?: string;
}

interface KhataEvaluationCanvasModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    initialMarks?: number;
    maxMarks?: number;
    questionText?: string;
    studentName?: string;
    pageNumber?: number;
    totalPages?: number;
    initialFeedback?: string;
    onSave: (result: KhataAnnotationResult) => Promise<void> | void;
}

type ToolType = 'pen' | 'highlighter' | 'text' | 'stamp_tick' | 'stamp_cross' | 'stamp_doubt' | 'stamp_star' | 'rect' | 'circle';

interface Point {
    x: number;
    y: number;
}

interface DrawAction {
    id: string;
    type: 'path' | 'rect' | 'circle' | 'text' | 'stamp';
    points?: Point[];
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    text?: string;
    stampType?: 'tick' | 'cross' | 'doubt' | 'star';
    color: string;
    width: number;
    fontSize?: number;
    isHighlighter?: boolean;
}

const PRESET_COLORS = [
    { name: 'লাল (Red)', hex: '#ef4444' },
    { name: 'সবুজ (Green)', hex: '#10b981' },
    { name: 'নীল (Blue)', hex: '#2563eb' },
    { name: 'হলুদ (Yellow)', hex: '#f59e0b' },
    { name: 'বেগুনি (Purple)', hex: '#8b5cf6' },
    { name: 'কালো (Black)', hex: '#0f172a' },
];

const QUICK_COMMENTS = [
    'সঠিক (+১)',
    'অসাধারণ উত্তর!',
    'আংশিক সঠিক',
    'ভুল সূত্র প্রয়োগ',
    'ক্যালকুলেশনে ভুল',
    'ব্যাখ্যা অসম্পূর্ণ',
    '-১',
    'হাতের লেখা অস্পষ্ট'
];

export const KhataEvaluationCanvasModal: React.FC<KhataEvaluationCanvasModalProps> = ({
    isOpen,
    onClose,
    imageUrl,
    initialMarks = 0,
    maxMarks = 10,
    questionText,
    studentName,
    pageNumber = 1,
    totalPages = 1,
    initialFeedback = '',
    onSave,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Image & Sizing state
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
    const [zoom, setZoom] = useState<number>(1);

    // Drawing Tool State
    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [strokeColor, setStrokeColor] = useState<string>('#ef4444'); // Default teacher red
    const [strokeWidth, setStrokeWidth] = useState<number>(3);
    const [fontSize, setFontSize] = useState<number>(20);

    // Actions History
    const [actions, setActions] = useState<DrawAction[]>([]);
    const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);

    // Text Tool Input state
    const [textPromptPos, setTextPromptPos] = useState<Point | null>(null);
    const [textInputValue, setTextInputValue] = useState<string>('');

    // Teacher Marks & Feedback input
    const [marks, setMarks] = useState<number>(initialMarks);
    const [feedback, setFeedback] = useState<string>(initialFeedback);
    const [saving, setSaving] = useState(false);

    // Load Background Image
    useEffect(() => {
        if (!isOpen || !imageUrl) return;

        setImgLoading(true);
        setImgError(false);
        setActions([]);
        setRedoStack([]);
        setRotation(0);
        setZoom(1);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImageObj(img);
            setImgLoading(false);
        };
        img.onerror = () => {
            setImgLoading(false);
            setImgError(true);
        };
        img.src = imageUrl;
    }, [isOpen, imageUrl]);

    // Update initial state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMarks(initialMarks);
            setFeedback(initialFeedback || '');
        }
    }, [isOpen, initialMarks, initialFeedback]);

    // Redraw Canvas on changes
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageObj) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isRotated90or270 = rotation === 90 || rotation === 270;
        const nativeWidth = isRotated90or270 ? imageObj.height : imageObj.width;
        const nativeHeight = isRotated90or270 ? imageObj.width : imageObj.height;

        // Set high-res canvas dimensions
        if (canvas.width !== nativeWidth || canvas.height !== nativeHeight) {
            canvas.width = nativeWidth;
            canvas.height = nativeHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Image with Rotation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
            imageObj,
            -imageObj.width / 2,
            -imageObj.height / 2,
            imageObj.width,
            imageObj.height
        );
        ctx.restore();

        // Helper to draw a single action
        const drawSingleAction = (act: DrawAction) => {
            ctx.save();

            if (act.isHighlighter) {
                ctx.globalAlpha = 0.38;
                ctx.strokeStyle = act.color;
                ctx.lineWidth = act.width * 3.5;
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';
            } else {
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = act.color;
                ctx.fillStyle = act.color;
                ctx.lineWidth = act.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }

            if (act.type === 'path' && act.points && act.points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(act.points[0].x, act.points[0].y);
                for (let i = 1; i < act.points.length; i++) {
                    ctx.lineTo(act.points[i].x, act.points[i].y);
                }
                ctx.stroke();
            } else if (act.type === 'rect' && act.startX !== undefined && act.startY !== undefined && act.endX !== undefined && act.endY !== undefined) {
                ctx.beginPath();
                const x = Math.min(act.startX, act.endX);
                const y = Math.min(act.startY, act.endY);
                const w = Math.abs(act.endX - act.startX);
                const h = Math.abs(act.endY - act.startY);
                ctx.strokeRect(x, y, w, h);
            } else if (act.type === 'circle' && act.startX !== undefined && act.startY !== undefined && act.endX !== undefined && act.endY !== undefined) {
                ctx.beginPath();
                const radiusX = Math.abs(act.endX - act.startX) / 2;
                const radiusY = Math.abs(act.endY - act.startY) / 2;
                const centerX = Math.min(act.startX, act.endX) + radiusX;
                const centerY = Math.min(act.startY, act.endY) + radiusY;
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (act.type === 'text' && act.points && act.points.length > 0 && act.text) {
                const pt = act.points[0];
                const fSize = act.fontSize || 20;
                ctx.font = `bold ${fSize}px sans-serif`;

                // Measure text for background highlight tag
                const metrics = ctx.measureText(act.text);
                const pad = 6;
                const bgW = metrics.width + pad * 2;
                const bgH = fSize + pad * 1.5;

                // Draw background tag pill
                ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                ctx.strokeStyle = act.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(pt.x - pad, pt.y - fSize - pad / 2, bgW, bgH, 6);
                ctx.fill();
                ctx.stroke();

                // Draw text
                ctx.fillStyle = act.color;
                ctx.fillText(act.text, pt.x, pt.y);
            } else if (act.type === 'stamp' && act.points && act.points.length > 0) {
                const pt = act.points[0];
                const size = 36;

                if (act.stampType === 'tick') {
                    // Big Green Tick
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 5;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(pt.x - size / 2, pt.y);
                    ctx.lineTo(pt.x - size / 6, pt.y + size / 2.5);
                    ctx.lineTo(pt.x + size / 1.8, pt.y - size / 2);
                    ctx.stroke();
                } else if (act.stampType === 'cross') {
                    // Big Red Cross
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 5;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(pt.x - size / 2.5, pt.y - size / 2.5);
                    ctx.lineTo(pt.x + size / 2.5, pt.y + size / 2.5);
                    ctx.moveTo(pt.x + size / 2.5, pt.y - size / 2.5);
                    ctx.lineTo(pt.x - size / 2.5, pt.y + size / 2.5);
                    ctx.stroke();
                } else if (act.stampType === 'doubt') {
                    // Question Mark
                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 38px sans-serif';
                    ctx.fillText('?', pt.x - size / 4, pt.y + size / 3);
                } else if (act.stampType === 'star') {
                    // Star
                    ctx.fillStyle = '#eab308';
                    ctx.font = 'bold 36px sans-serif';
                    ctx.fillText('★', pt.x - size / 3, pt.y + size / 3);
                }
            }

            ctx.restore();
        };

        // 2. Render all historical actions
        actions.forEach(drawSingleAction);

        // 3. Render in-progress active action
        if (currentAction) {
            drawSingleAction(currentAction);
        }
    }, [imageObj, rotation, actions, currentAction]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Coordinate conversion from pointer screen position to native canvas pixels
    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    // Pointer Down (Start Drawing or Placing Stamp/Text)
    const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const pt = getCanvasPoint(e);
        if (!pt) return;

        // Stamp tool: instant stamp
        if (activeTool.startsWith('stamp_')) {
            const stampType = activeTool.replace('stamp_', '') as 'tick' | 'cross' | 'doubt' | 'star';
            const stampColor = stampType === 'tick' ? '#10b981' : stampType === 'cross' ? '#ef4444' : strokeColor;

            const newAction: DrawAction = {
                id: String(Date.now()),
                type: 'stamp',
                points: [pt],
                stampType,
                color: stampColor,
                width: strokeWidth,
            };

            setActions(prev => [...prev, newAction]);
            setRedoStack([]);
            return;
        }

        // Text tool: open floating text prompt at this point
        if (activeTool === 'text') {
            setTextPromptPos(pt);
            setTextInputValue('');
            return;
        }

        // Pen, Highlighter, Rect, Circle
        setIsDrawing(true);
        const actionType = activeTool === 'rect' ? 'rect' : activeTool === 'circle' ? 'circle' : 'path';
        const isHighlighter = activeTool === 'highlighter';

        setCurrentAction({
            id: String(Date.now()),
            type: actionType,
            points: [pt],
            startX: pt.x,
            startY: pt.y,
            endX: pt.x,
            endY: pt.y,
            color: strokeColor,
            width: strokeWidth,
            isHighlighter,
        });
    };

    // Pointer Move
    const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentAction) return;
        const pt = getCanvasPoint(e);
        if (!pt) return;

        if (currentAction.type === 'path') {
            setCurrentAction(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    points: [...(prev.points || []), pt],
                };
            });
        } else if (currentAction.type === 'rect' || currentAction.type === 'circle') {
            setCurrentAction(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    endX: pt.x,
                    endY: pt.y,
                };
            });
        }
    };

    // Pointer Up
    const handlePointerUp = () => {
        if (!isDrawing || !currentAction) return;

        setIsDrawing(false);
        setActions(prev => [...prev, currentAction]);
        setCurrentAction(null);
        setRedoStack([]);
    };

    // Add text note onto paper
    const handleConfirmText = (textToAdd?: string) => {
        const text = (textToAdd !== undefined ? textToAdd : textInputValue).trim();
        if (!textPromptPos || !text) {
            setTextPromptPos(null);
            return;
        }

        const newAction: DrawAction = {
            id: String(Date.now()),
            type: 'text',
            points: [textPromptPos],
            text,
            color: strokeColor,
            width: strokeWidth,
            fontSize,
        };

        setActions(prev => [...prev, newAction]);
        setRedoStack([]);
        setTextPromptPos(null);
        setTextInputValue('');
    };

    // Undo action
    const handleUndo = () => {
        if (actions.length === 0) return;
        const last = actions[actions.length - 1];
        setActions(prev => prev.slice(0, prev.length - 1));
        setRedoStack(prev => [...prev, last]);
    };

    // Redo action
    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const lastRedo = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, prev.length - 1));
        setActions(prev => [...prev, lastRedo]);
    };

    // Clear all marks
    const handleClearAll = () => {
        if (actions.length === 0) return;
        if (window.confirm('আপনি কি এই পৃষ্ঠার সমস্ত দাগ ও মূল্যায়ন মুছে ফেলতে চান?')) {
            setActions([]);
            setRedoStack([]);
        }
    };

    // Rotate 90 degrees
    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    // Save and export final annotated image
    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            setSaving(true);
            renderCanvas();

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert('খাতা প্রসেস করতে ব্যর্থ হয়েছে।');
                    setSaving(false);
                    return;
                }

                const dataUrl = canvas.toDataURL('image/png', 0.95);

                await onSave({
                    annotatedBlob: blob,
                    dataUrl,
                    marks,
                    feedback,
                });

                setSaving(false);
                onClose();
            }, 'image/png', 0.95);
        } catch (err) {
            console.error('Failed to export annotated image', err);
            alert('খাতা সংরক্ষণ করতে সমস্যা হয়েছে।');
            setSaving(false);
        }
    };

    // Download annotated image to teacher's computer
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        renderCanvas();
        const link = document.createElement('a');
        link.download = `evaluated_sheet_${studentName ? studentName.replace(/\s+/g, '_') : 'khata'}_page_${pageNumber}.png`;
        link.href = canvas.toDataURL('image/png', 0.95);
        link.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Top Bar: Meta & Grading Controls */}
            <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-4 shrink-0 shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                        <Pen className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold truncate">
                                ডিজিটাল খাতা মূল্যায়ন {studentName ? `• ${studentName}` : ''}
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                পৃষ্ঠা {pageNumber} / {totalPages}
                            </span>
                        </div>
                        {questionText && (
                            <p className="text-[11px] text-slate-400 truncate max-w-md hidden sm:block">
                                প্রশ্ন: {questionText.replace(/<[^>]*>/g, '')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Teacher Marks & Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Quick Marks Input */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
                        <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
                            নম্বর:
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            value={marks}
                            onChange={(e) => setMarks(Number(e.target.value))}
                            className="w-16 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-600 text-white font-black text-sm text-center focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                        />
                        <span className="text-xs font-bold text-slate-400">/ {maxMarks}</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleDownload}
                        title="দাগানো খাতা ডাউনলোড করুন"
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-sky-400" />
                        <span className="hidden md:inline">ডাউনলোড</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/40 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>সংরক্ষণ করুন</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                        title="বন্ধ করুন"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Area: Toolbox + Canvas Workspace */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Floating Paint Toolbox */}
                <aside className="w-16 sm:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto select-none z-10">
                    {/* Tool Selection Group */}
                    <div className="flex flex-col items-center gap-1.5 w-full px-2">
                        <button
                            type="button"
                            onClick={() => setActiveTool('pen')}
                            title="কলম / পেন (Pen Draw)"
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                activeTool === 'pen'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Pen className="w-4 h-4" />
                            <span className="text-[9px]">পেন</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool('highlighter')}
                            title="হাইলাইটার (Highlighter)"
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                activeTool === 'highlighter'
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Highlighter className="w-4 h-4" />
                            <span className="text-[9px]">হাইলাইট</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool('text')}
                            title="টেক্সট / মন্তব্য লিখুন (Add Text Note)"
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                activeTool === 'text'
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Type className="w-4 h-4" />
                            <span className="text-[9px]">টেক্সট</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool('rect')}
                            title="বক্স / আয়তক্ষেত্র (Rectangle)"
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                activeTool === 'rect'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Square className="w-4 h-4" />
                            <span className="text-[9px]">বক্স</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool('circle')}
                            title="গোল দাগ / বৃত্ত (Circle)"
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                activeTool === 'circle'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Circle className="w-4 h-4" />
                            <span className="text-[9px]">বৃত্ত</span>
                        </button>
                    </div>

                    <div className="w-8 h-px bg-slate-800" />

                    {/* Teacher Quick Stamps */}
                    <div className="flex flex-col items-center gap-1.5 w-full px-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">স্ট্যাম্প</span>
                        
                        <button
                            type="button"
                            onClick={() => setActiveTool('stamp_tick')}
                            title="টিক মার্ক (Correct)"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                activeTool === 'stamp_tick'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 scale-105'
                                    : 'text-emerald-500 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40'
                            }`}
                        >
                            <Check className="w-5 h-5 stroke-[3]" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool('stamp_cross')}
                            title="ক্রস মার্ক (Incorrect)"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                activeTool === 'stamp_cross'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 scale-105'
                                    : 'text-rose-500 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40'
                            }`}
                        >
                            <X className="w-5 h-5 stroke-[3]" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool('stamp_doubt')}
                            title="সন্দেহ / প্রশ্নবোধক (?)"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                activeTool === 'stamp_doubt'
                                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40 scale-105'
                                    : 'text-amber-500 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40'
                            }`}
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool('stamp_star')}
                            title="স্টার (Star)"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                activeTool === 'stamp_star'
                                    ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/40 scale-105'
                                    : 'text-yellow-400 bg-yellow-950/40 hover:bg-yellow-900/40 border border-yellow-800/40'
                            }`}
                        >
                            <Star className="w-5 h-5 fill-current" />
                        </button>
                    </div>

                    <div className="w-8 h-px bg-slate-800" />

                    {/* Color Palette */}
                    <div className="flex flex-col items-center gap-1.5 w-full px-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">রং</span>
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c.hex}
                                type="button"
                                onClick={() => setStrokeColor(c.hex)}
                                title={c.name}
                                style={{ backgroundColor: c.hex }}
                                className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                                    strokeColor === c.hex ? 'ring-2 ring-white scale-125 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-110'
                                }`}
                            />
                        ))}
                        {/* Custom color input */}
                        <label title="কাস্টম রং" className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center cursor-pointer hover:border-slate-500 mt-1">
                            <Palette className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="color"
                                value={strokeColor}
                                onChange={(e) => setStrokeColor(e.target.value)}
                                className="sr-only"
                            />
                        </label>
                    </div>

                    <div className="w-8 h-px bg-slate-800" />

                    {/* Stroke Width Selector */}
                    <div className="flex flex-col items-center gap-2 w-full px-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">সাইজ</span>
                        {[2, 4, 8, 14].map(w => (
                            <button
                                key={w}
                                type="button"
                                onClick={() => setStrokeWidth(w)}
                                title={`Stroke Width: ${w}px`}
                                className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                    strokeWidth === w ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                <span
                                    style={{
                                        width: `${Math.min(w * 1.5, 20)}px`,
                                        height: `${Math.min(w, 10)}px`,
                                        backgroundColor: strokeColor,
                                        borderRadius: '999px',
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Center: Canvas Workspace Container */}
                <main
                    ref={containerRef}
                    className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative"
                    style={{ touchAction: isDrawing ? 'none' : 'auto' }}
                >
                    {/* Floating Zoom & Canvas Tools */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
                        <button
                            type="button"
                            onClick={handleRotate}
                            title="খাতা ৯০° ঘোরান (Rotate 90°)"
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-slate-800" />
                        <button
                            type="button"
                            onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                            title="বড় করুন (Zoom In)"
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-400 px-1">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            type="button"
                            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                            title="ছোট করুন (Zoom Out)"
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoom(1)}
                            title="আসল সাইজ (100%)"
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-slate-800" />
                        <button
                            type="button"
                            onClick={handleUndo}
                            disabled={actions.length === 0}
                            title="পূর্বাবস্থায় ফেরান (Undo)"
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRedo}
                            disabled={redoStack.length === 0}
                            title="পুনরায় করুন (Redo)"
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={actions.length === 0}
                            title="সব দাগ মুছুন (Clear All)"
                            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {imgLoading ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                            <p className="text-sm font-semibold">শিক্ষার্থীর উত্তরপত্র লোড হচ্ছে...</p>
                        </div>
                    ) : imgError ? (
                        <div className="text-center p-8 rounded-2xl bg-slate-900 border border-slate-800 text-rose-400 space-y-2">
                            <XCircle className="w-10 h-10 mx-auto" />
                            <h4 className="font-bold text-base text-white">উত্তরপত্র ইমেজ লোড করা সম্ভব হয়নি</h4>
                            <p className="text-xs text-slate-400">ইমেজ লিংকটি সক্রিয় আছে কিনা অথবা ফরম্যাট সঠিক কিনা যাচাই করুন।</p>
                        </div>
                    ) : (
                        <div
                            className="relative max-w-full max-h-full transition-transform duration-100 ease-out shadow-2xl rounded-lg"
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center center',
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handlePointerDown}
                                onMouseMove={handlePointerMove}
                                onMouseUp={handlePointerUp}
                                onMouseLeave={handlePointerUp}
                                onTouchStart={handlePointerDown}
                                onTouchMove={handlePointerMove}
                                onTouchEnd={handlePointerUp}
                                className={`rounded-lg bg-white shadow-2xl block ${
                                    activeTool === 'pen' || activeTool === 'highlighter'
                                        ? 'cursor-crosshair'
                                        : activeTool === 'text'
                                        ? 'cursor-text'
                                        : 'cursor-cell'
                                }`}
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: 'calc(100vh - 8rem)',
                                    objectFit: 'contain',
                                }}
                            />

                            {/* Floating Text Input Popover */}
                            {textPromptPos && (
                                <div
                                    className="absolute z-30 p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl text-white space-y-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                                    style={{
                                        left: '50%',
                                        top: '30%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '320px',
                                    }}
                                >
                                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-1.5">
                                        <span className="flex items-center gap-1.5 text-sky-400">
                                            <Type className="w-3.5 h-3.5" />
                                            খাতায় মন্তব্য যুক্ত করুন
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setTextPromptPos(null)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Fast Preset Comment Pills */}
                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                        {QUICK_COMMENTS.map((c, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleConfirmText(c)}
                                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={textInputValue}
                                            onChange={(e) => setTextInputValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleConfirmText();
                                                if (e.key === 'Escape') setTextPromptPos(null);
                                            }}
                                            placeholder="আপনার মন্তব্য টাইপ করুন..."
                                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleConfirmText()}
                                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                                        >
                                            যুক্ত
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Bottom Bar: Teacher Feedback Note Input */}
            <footer className="h-14 px-4 sm:px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4 shrink-0 text-white text-xs">
                <div className="flex items-center gap-2 flex-1 max-w-2xl">
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                        type="text"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="এই প্রশ্নের জন্য শিক্ষার্থীর উদ্দেশ্যে কোনো পরামর্শ বা মন্তব্য লিখুন..."
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                    <span className="hidden sm:inline">
                        টুল নির্বাচন করে খাতার উপরে ক্লিক বা ড্র্যাগ করুন।
                    </span>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>মূল্যায়ন সম্পন্ন করুন</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};
