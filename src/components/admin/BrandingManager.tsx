// Leave Management App - Branding Manager Component
// Allows admins to upload a custom header icon (whitelabel)
// Following accessibility skill guidelines for WCAG 2.2 compliance

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    X,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2,
    Trash2,
    Palmtree,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Constants for icon validation
const MAX_FILE_SIZE = 512 * 1024; // 512KB
const MAX_DIMENSIONS = 128; // 128x128px recommended
const ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];
const ALLOWED_EXTENSIONS = '.png, .svg, .webp, .jpg, .jpeg';

interface BrandingManagerProps {
    headerIcon: string;
    headerIconFileName: string;
    onIconChange: (icon: string, fileName: string) => void;
}

export default function BrandingManager({
    headerIcon,
    headerIconFileName,
    onIconChange,
}: BrandingManagerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>(headerIcon);
    const [previewFileName, setPreviewFileName] = useState<string>(headerIconFileName);
    const [error, setError] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Validate uploaded file
     */
    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS}`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Maximum size: ${MAX_FILE_SIZE / 1024}KB`;
        }
        return null;
    };

    /**
     * Process and validate image dimensions
     */
    const processImage = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;

                // For SVG, skip dimension check
                if (file.type === 'image/svg+xml') {
                    resolve(dataUrl);
                    return;
                }

                // Check dimensions for raster images
                const img = new Image();
                img.onload = () => {
                    if (img.width > MAX_DIMENSIONS * 2 || img.height > MAX_DIMENSIONS * 2) {
                        // Warn but allow - will be displayed at max size anyway
                        console.warn(`Image dimensions (${img.width}x${img.height}) exceed recommended ${MAX_DIMENSIONS}x${MAX_DIMENSIONS}px`);
                    }
                    resolve(dataUrl);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = dataUrl;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }, []);

    /**
     * Handle file selection
     */
    const handleFileSelect = async (file: File) => {
        setError('');
        setIsProcessing(true);

        try {
            // Validate file
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                setIsProcessing(false);
                return;
            }

            // Process image
            const dataUrl = await processImage(file);
            setPreviewUrl(dataUrl);
            setPreviewFileName(file.name);

            toast.success('Icon uploaded', {
                description: 'Click "Save Changes" to apply your new header icon.',
            });
        } catch (err) {
            setError('Failed to process image. Please try another file.');
            console.error('Image processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Handle drag events
     */
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    /**
     * Handle file input change
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    /**
     * Apply the preview as the new icon
     */
    const handleApply = () => {
        onIconChange(previewUrl, previewFileName);
        toast.success('Icon applied', {
            description: 'Remember to save settings to persist this change.',
        });
    };

    /**
     * Remove the current icon
     */
    const handleRemove = () => {
        setPreviewUrl('');
        setPreviewFileName('');
        onIconChange('', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.info('Icon removed', {
            description: 'The default icon will be used.',
        });
    };

    /**
     * Cancel preview and revert to current icon
     */
    const handleCancelPreview = () => {
        setPreviewUrl(headerIcon);
        setPreviewFileName(headerIconFileName);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const hasPreviewChanged = previewUrl !== headerIcon;

    return (
        <Card className="border-muted/40 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    Header Icon (Whitelabel)
                </CardTitle>
                <CardDescription>
                    Upload a custom icon to replace the default palm tree in the header.
                    Recommended: 128x128px, PNG or SVG format.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current/Preview Icon Display */}
                <div className="flex items-start gap-6">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Current Icon</Label>
                        <div
                            className="w-20 h-20 rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/20"
                            aria-label="Current header icon"
                        >
                            {headerIcon ? (
                                <img
                                    src={headerIcon}
                                    alt="Current header icon"
                                    className="w-12 h-12 object-contain"
                                />
                            ) : (
                                <Palmtree className="w-10 h-10 text-primary" aria-hidden="true" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground max-w-[80px] truncate">
                            {headerIconFileName || 'Default'}
                        </p>
                    </div>

                    {hasPreviewChanged && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2"
                        >
                            <Label className="text-sm text-primary font-medium">Preview</Label>
                            <div
                                className="w-20 h-20 rounded-lg border-2 border-primary/50 flex items-center justify-center bg-primary/5"
                                aria-label="Preview of new header icon"
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview of new header icon"
                                        className="w-12 h-12 object-contain"
                                    />
                                ) : (
                                    <Palmtree className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground max-w-[80px] truncate">
                                {previewFileName || 'Default'}
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Upload Zone */}
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload icon. Drag and drop or click to select a file"
                    className={`
                        relative rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer
                        ${isDragging
                            ? 'border-primary bg-primary/5 scale-[1.02]'
                            : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
                        }
                        ${error ? 'border-destructive/50 bg-destructive/5' : ''}
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_EXTENSIONS}
                        onChange={handleInputChange}
                        className="sr-only"
                        aria-describedby="upload-description upload-error"
                    />

                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className={`
                            p-3 rounded-full transition-colors
                            ${isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                        `}>
                            <Upload className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div id="upload-description">
                            <p className="font-medium">
                                {isDragging ? 'Drop your icon here' : 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {ALLOWED_EXTENSIONS} (max {MAX_FILE_SIZE / 1024}KB)
                            </p>
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                                <span className="text-sm">Processing...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            id="upload-error"
                            role="alert"
                            className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                    {hasPreviewChanged && (
                        <>
                            <Button onClick={handleApply} size="sm" className="gap-2">
                                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                                Apply Preview
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelPreview}
                                className="gap-2"
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                                Cancel
                            </Button>
                        </>
                    )}

                    {(headerIcon || previewUrl) && !hasPreviewChanged && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    Remove Icon
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Remove custom icon?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove the custom header icon and revert to the default palm tree icon.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRemove}>
                                        Remove
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                {/* Guidelines */}
                <div className="rounded-lg bg-muted/30 p-4 text-sm space-y-2">
                    <p className="font-medium">Icon Guidelines:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1" role="list">
                        <li>Recommended size: 128x128 pixels</li>
                        <li>Formats: PNG (with transparency), SVG, or WebP</li>
                        <li>Maximum file size: 512KB</li>
                        <li>Use a simple, recognizable logo that works at small sizes</li>
                        <li>Ensure sufficient contrast in both light and dark modes</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
