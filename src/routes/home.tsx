import { useRef, useState, useEffect, useMemo } from 'react';
import { ArrowRight, Info } from 'react-feather';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/auth-context';
import {
	AgentModeToggle,
	type AgentMode,
} from '../components/agent-mode-toggle';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { usePaginatedApps } from '@/hooks/use-paginated-apps';
import { AnimatePresence, motion } from 'framer-motion';
import { AppCard } from '@/components/shared/AppCard';
import clsx from 'clsx';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { ImageUploadButton } from '@/components/image-upload-button';
import { ImageAttachmentPreview } from '@/components/image-attachment-preview';
import { SUPPORTED_IMAGE_MIME_TYPES } from '@/api-types';
import { WavyBackground } from '@/components/ui/wavy-background';
import { Button } from '@/components/ui/button';
import { Sparkles, Code, Rocket } from 'lucide-react';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export default function Home() {
	const navigate = useNavigate();
	const { requireAuth } = useAuthGuard();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [agentMode, setAgentMode] = useState<AgentMode>('deterministic');
	const [query, setQuery] = useState('');
	const { user } = useAuth();
	const { showAuthModal } = useAuthModal();

	const { images, addImages, removeImage, clearImages, isProcessing } = useImageUpload({
		onError: (error) => {
			// TODO: Show error toast/notification
			console.error('Image upload error:', error);
		},
	});

	const { isDragging, dragHandlers } = useDragDrop({
		onFilesDropped: addImages,
		accept: [...SUPPORTED_IMAGE_MIME_TYPES],
	});


	const placeholderPhrases = useMemo(() => [
		"todo list app",
		"F1 fantasy game",
		"personal finance tracker"
	], []);
	const [currentPlaceholderPhraseIndex, setCurrentPlaceholderPhraseIndex] = useState(0);
	const [currentPlaceholderText, setCurrentPlaceholderText] = useState("");
	const [isPlaceholderTyping, setIsPlaceholderTyping] = useState(true);

	const {
		apps,
		loading,
	} = usePaginatedApps({
		type: 'public',
		defaultSort: 'popular',
		defaultPeriod: 'week',
		limit: 6,
	});

	// Discover section should appear only when enough apps are available and loading is done
	const discoverReady = useMemo(() => !loading && (apps?.length ?? 0) > 5, [loading, apps]);

	const handleCreateApp = (query: string, mode: AgentMode) => {
		const encodedQuery = encodeURIComponent(query);
		const encodedMode = encodeURIComponent(mode);
		
		// Encode images as JSON if present
		const imageParam = images.length > 0 ? `&images=${encodeURIComponent(JSON.stringify(images))}` : '';
		const intendedUrl = `/chat/new?query=${encodedQuery}&agentMode=${encodedMode}${imageParam}`;

		if (
			!requireAuth({
				requireFullAuth: true,
				actionContext: 'to create applications',
				intendedUrl: intendedUrl,
			})
		) {
			return;
		}

		// User is already authenticated, navigate immediately
		navigate(intendedUrl);
		// Clear images after navigation
		clearImages();
	};

	// Auto-resize textarea based on content
	const adjustTextareaHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			const scrollHeight = textareaRef.current.scrollHeight;
			const maxHeight = 300; // Maximum height in pixels
			textareaRef.current.style.height =
				Math.min(scrollHeight, maxHeight) + 'px';
		}
	};

	useEffect(() => {
		adjustTextareaHeight();
	}, []);

	// Typewriter effect
	useEffect(() => {
		const currentPhrase = placeholderPhrases[currentPlaceholderPhraseIndex];

		if (isPlaceholderTyping) {
			if (currentPlaceholderText.length < currentPhrase.length) {
				const timeout = setTimeout(() => {
					setCurrentPlaceholderText(currentPhrase.slice(0, currentPlaceholderText.length + 1));
				}, 100); // Typing speed
				return () => clearTimeout(timeout);
			} else {
				// Pause before erasing
				const timeout = setTimeout(() => {
					setIsPlaceholderTyping(false);
				}, 2000); // Pause duration
				return () => clearTimeout(timeout);
			}
		} else {
			if (currentPlaceholderText.length > 0) {
				const timeout = setTimeout(() => {
					setCurrentPlaceholderText(currentPlaceholderText.slice(0, -1));
				}, 50); // Erasing speed
				return () => clearTimeout(timeout);
			} else {
				// Move to next phrase
				setCurrentPlaceholderPhraseIndex((prev) => (prev + 1) % placeholderPhrases.length);
				setIsPlaceholderTyping(true);
			}
		}
	}, [currentPlaceholderText, currentPlaceholderPhraseIndex, isPlaceholderTyping, placeholderPhrases]);

	return (
		<WavyBackground
			containerClassName="min-h-screen"
			colors={["#A033FF", "#FF00FF", "#FF9933", "#22d3ee", "#818cf8"]}
			waveWidth={50}
			backgroundFill="transparent"
			blur={10}
			speed="fast"
			waveOpacity={0.5}
		>
			<div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
			
			<div className="relative z-10 w-full px-4 py-12">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-7xl mx-auto mb-16"
				>
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-4">
							<div className="text-white">
								<h1 className="text-3xl font-bold">web4.sbs</h1>
								<p className="text-white/60">AI-Powered App Builder</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							{user ? (
								<Button 
									variant="outline" 
									className="text-white border-white/20 hover:bg-white/10"
									onClick={() => navigate('/apps')}
								>
									Dashboard
								</Button>
							) : (
								<>
									<Button 
										variant="ghost" 
										className="text-white/80 hover:text-white hover:bg-white/10"
										onClick={() => showAuthModal('to access your dashboard')}
									>
										Log in
									</Button>
									<Button 
										className="bg-white text-black hover:bg-white/90"
										onClick={() => showAuthModal('to get started')}
									>
										Get started
									</Button>
								</>
							)}
						</div>
					</div>

					{/* Hero Section */}
					<div className="text-center max-w-4xl mx-auto mb-20">
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="text-6xl md:text-7xl font-bold text-white mb-6"
						>
							Build something
							<span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
								Lovable
							</span>
						</motion.h2>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="text-xl text-white/80 mb-8"
						>
							Create apps and websites by chatting with AI
						</motion.p>

						{/* Main Input Form */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							className="relative"
						>
							<form
								method="POST"
								onSubmit={(e) => {
									e.preventDefault();
									const query = textareaRef.current!.value;
									handleCreateApp(query, agentMode);
								}}
								className="relative z-10"
							>
								<div className="relative">
									<div 
										className={clsx(
											"flex flex-col w-full min-h-[150px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 transition-all duration-200",
											isDragging && "ring-2 ring-purple-400 ring-offset-2"
										)}
										{...dragHandlers}
									>
										{isDragging && (
											<div className="absolute inset-0 flex items-center justify-center bg-purple-500/20 backdrop-blur-sm rounded-2xl z-30 pointer-events-none">
												<p className="text-white font-medium">Drop images here</p>
											</div>
										)}
										<textarea
											className="w-full resize-none ring-0 z-20 outline-0 placeholder:text-white/50 text-white bg-transparent text-lg"
											name="query"
											value={query}
											placeholder={`Create a ${currentPlaceholderText}`}
											ref={textareaRef}
											onChange={(e) => {
												setQuery(e.target.value);
												adjustTextareaHeight();
											}}
											onInput={adjustTextareaHeight}
											onKeyDown={(e) => {
												if (e.key === 'Enter' && !e.shiftKey) {
													e.preventDefault();
													const query = textareaRef.current!.value;
													handleCreateApp(query, agentMode);
												}
											}}
										/>
										{images.length > 0 && (
											<div className="mt-3">
												<ImageAttachmentPreview
													images={images}
													onRemove={removeImage}
												/>
											</div>
										)}
									</div>
									<div className="flex items-center justify-between mt-4">
										{import.meta.env.VITE_AGENT_MODE_ENABLED ? (
											<AgentModeToggle
												value={agentMode}
												onChange={setAgentMode}
												className="flex-1"
											/>
										) : (
											<div></div>
										)}

										<div className="flex items-center justify-end ml-4 gap-2">
											<ImageUploadButton
												onFilesSelected={addImages}
												disabled={isProcessing}
											/>
											<button
												type="submit"
												disabled={!query.trim()}
												className="bg-white text-black p-3 rounded-xl transition-all duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<ArrowRight className="size-5" />
											</button>
										</div>
									</div>
								</div>
							</form>

							<AnimatePresence>
								{images.length > 0 && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="mt-4"
									>
										<div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm">
											<Info className="size-4 text-white flex-shrink-0 mt-0.5" />
											<p className="text-xs text-white/80 leading-relaxed">
												<span className="font-medium text-white">Images Beta:</span> Images guide app layout and design but may not be replicated exactly.
											</p>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					</div>

					{/* Features Section */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className="grid md:grid-cols-3 gap-6 mb-20"
					>
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
							<Sparkles className="size-8 text-purple-400 mb-4" />
							<h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
							<p className="text-white/70">Build with the power of artificial intelligence</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
							<Code className="size-8 text-pink-400 mb-4" />
							<h3 className="text-xl font-semibold text-white mb-2">Full Stack</h3>
							<p className="text-white/70">Generate complete applications in minutes</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
							<Rocket className="size-8 text-orange-400 mb-4" />
							<h3 className="text-xl font-semibold text-white mb-2">Instant Deploy</h3>
							<p className="text-white/70">Launch your app with one click</p>
						</div>
					</motion.div>
				</motion.div>

				{/* Discover Section */}
				<AnimatePresence>
					{discoverReady && (
						<motion.section
							key="discover-section"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.5 }}
							className="max-w-7xl mx-auto px-4"
						>
							<div className="flex flex-col items-start mb-8">
								<h2 className="text-3xl font-bold text-white mb-4">Discover Apps built by the community</h2>
								<button
									onClick={() => navigate('/discover')}
									className="text-white/80 hover:text-white transition-colors underline underline-offset-4"
								>
									View All
								</button>
							</div>
							<motion.div
								layout
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
							>
								<AnimatePresence mode="popLayout">
									{apps.map(app => (
										<AppCard
											key={app.id}
											app={app}
											onClick={() => navigate(`/app/${app.id}`)}
											showStats={true}
											showUser={true}
											showActions={false}
										/>
									))}
								</AnimatePresence>
							</motion.div>
						</motion.section>
					)}
				</AnimatePresence>
			</div>
		</WavyBackground>
	);
}
