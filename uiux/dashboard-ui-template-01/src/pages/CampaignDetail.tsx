import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  SparklesIcon,
  PencilIcon,
  CheckIcon,
  PlusIcon,
  RefreshCwIcon,
  ImageIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
  FilterIcon,
  AlertCircleIcon } from
'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
interface CampaignDetailProps {
  onBack: () => void;
  onNavigateToReview: () => void;
}
type MainTab = 'brief' | 'generated' | 'assets';
type GenerationTab = 'concepts' | 'copy' | 'images';
function ConceptCard({
  theme,
  headlines,
  visual,
  selected,
  onSelect






}: {theme: string;headlines: [string, string];visual: string;selected: boolean;onSelect: () => void;}) {
  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 shadow-card transition-all cursor-pointer ${selected ? 'border-[#0D9488] shadow-card-hover' : 'border-[#E8E5DF] hover:border-[#0D9488]/40 hover:shadow-card-hover'}`}
      onClick={onSelect}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}>

      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
            Concept Theme
          </span>
          <h3 className="text-sm font-bold text-[#1C1917] mt-0.5">{theme}</h3>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-[#0D9488] border-[#0D9488]' : 'border-[#E8E5DF]'}`}>

          {selected && <CheckIcon className="w-3 h-3 text-white" />}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <p className="text-sm italic text-[#1C1917] font-medium">
          "{headlines[0]}"
        </p>
        <p className="text-sm italic text-[#78716C]">"{headlines[1]}"</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-[#F5F4F0] rounded-lg">
        <ImageIcon className="w-3.5 h-3.5 text-[#78716C] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#78716C]">{visual}</p>
      </div>

      <button
        className={`mt-4 w-full py-2 text-xs font-semibold rounded-lg transition-colors ${selected ? 'bg-[#0D9488] text-white hover:bg-[#0F766E]' : 'bg-[#F5F4F0] text-[#1C1917] hover:bg-[#E8E5DF]'}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}>

        {selected ? '✓ Selected' : 'Use this concept'}
      </button>
    </div>);

}
function SkeletonConceptCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E5DF] p-5 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1.5">
          <div className="h-2.5 w-20 bg-[#F5F4F0] rounded animate-pulse" />
          <div className="h-4 w-28 bg-[#F5F4F0] rounded animate-pulse" />
        </div>
        <div className="w-5 h-5 rounded-full bg-[#F5F4F0] animate-pulse" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3.5 w-full bg-[#F5F4F0] rounded animate-pulse" />
        <div className="h-3.5 w-4/5 bg-[#F5F4F0] rounded animate-pulse" />
      </div>
      <div className="h-14 bg-[#F5F4F0] rounded-lg animate-pulse" />
      <div className="h-8 w-full bg-[#F5F4F0] rounded-lg animate-pulse mt-4" />
    </div>);

}
export function CampaignDetail({
  onBack,
  onNavigateToReview
}: CampaignDetailProps) {
  const [mainTab, setMainTab] = useState<MainTab>('generated');
  const [genTab, setGenTab] = useState<GenerationTab>('concepts');
  const [selectedConcepts, setSelectedConcepts] = useState<Set<number>>(
    new Set()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prompt, setPrompt] = useState('');
  const toggleConcept = (i: number) => {
    setSelectedConcepts((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);else
      next.add(i);
      return next;
    });
  };
  const handleGenerate = () => {
    setIsGenerating(true);
    setHasError(false);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2500);
  };
  const assetRows = [
  {
    icon: LayersIcon,
    name: 'Summer Freedom Concept',
    status: 'approved' as const,
    time: '2h ago'
  },
  {
    icon: LayersIcon,
    name: 'Athletic Energy Concept',
    status: 'in-review' as const,
    time: '2h ago'
  },
  {
    icon: LayersIcon,
    name: 'Urban Explorer Concept',
    status: 'draft' as const,
    time: '2h ago'
  },
  {
    icon: FileTextIcon,
    name: 'Hero Copy v1',
    status: 'changes-requested' as const,
    time: '1d ago'
  },
  {
    icon: FileTextIcon,
    name: 'Brand Voice Copy v3',
    status: 'in-review' as const,
    time: '5h ago'
  },
  {
    icon: ImageIcon,
    name: 'Summer Vibes Hero',
    status: 'submitted' as const,
    time: '3h ago'
  },
  {
    icon: ImageIcon,
    name: 'Product Shot Pack',
    status: 'draft' as const,
    time: '1d ago'
  },
  {
    icon: ImageIcon,
    name: 'Social Story Set',
    status: 'approved' as const,
    time: '2d ago'
  }];

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Campaign Header */}
      <div className="bg-white border-b border-[#E8E5DF] px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#0D9488] transition-colors">

            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Campaigns
          </button>
          <span className="text-[#E8E5DF]">/</span>
          <span className="text-xs text-[#1C1917] font-medium">
            Nike Summer 2024
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1C1917] mb-2">
              Nike Summer 2024 Campaign
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">SC</span>
                </div>
                <span className="text-xs text-[#78716C]">Sarah Chen</span>
              </div>
              <span className="text-xs text-[#78716C]">
                Created Jan 15, 2024
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#78716C]">Brand:</span>
                <button className="flex items-center gap-1 text-xs font-medium text-[#1C1917] bg-[#F5F4F0] px-2.5 py-1 rounded-lg hover:bg-[#E8E5DF] transition-colors">
                  Nike
                  <ChevronDownIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">
              <PencilIcon className="w-3.5 h-3.5" />
              Edit Brief
            </button>
            <StatusBadge status="in-review" />
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-0 mt-5 border-b border-[#E8E5DF] -mb-5">
          {(['brief', 'generated', 'assets'] as MainTab[]).map((tab) =>
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${mainTab === tab ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-[#78716C] hover:text-[#1C1917]'}`}>

              {tab === 'generated' ?
            'Generated' :
            tab === 'assets' ?
            'All Assets' :
            'Brief'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Brief Tab */}
        {mainTab === 'brief' &&
        <div className="p-8 overflow-y-auto h-full scrollbar-thin">
            <div className="max-w-2xl space-y-5">
              <h2 className="text-base font-semibold text-[#1C1917]">
                Campaign Brief
              </h2>
              {[
            {
              label: 'Campaign Name',
              value: 'Nike Summer 2024 Campaign',
              type: 'input'
            },
            {
              label: 'Brand',
              value: 'Nike',
              type: 'input'
            },
            {
              label: 'Target Audience',
              value: '18–35 year olds, active lifestyle, urban dwellers',
              type: 'textarea'
            },
            {
              label: 'Key Message',
              value: 'Summer is yours — own every moment with Nike',
              type: 'textarea'
            },
            {
              label: 'Tone of Voice',
              value: 'Energetic, empowering, authentic',
              type: 'input'
            }].
            map((field) =>
            <div key={field.label}>
                  <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-1.5">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ?
              <textarea
                defaultValue={field.value}
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm text-[#1C1917] bg-white border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none transition-all" /> :


              <input
                type="text"
                defaultValue={field.value}
                className="w-full px-3.5 py-2.5 text-sm text-[#1C1917] bg-white border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all" />

              }
                </div>
            )}
              <div>
                <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-1.5">
                  Channels
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Social Media', 'Display Ads', 'Email', 'OOH', 'Video'].map(
                  (ch) =>
                  <label
                    key={ch}
                    className="flex items-center gap-2 cursor-pointer">

                        <input
                      type="checkbox"
                      defaultChecked={[
                      'Social Media',
                      'Display Ads'].
                      includes(ch)}
                      className="w-4 h-4 rounded border-[#E8E5DF] text-[#0D9488] focus:ring-[#0D9488]/30" />

                        <span className="text-sm text-[#1C1917]">{ch}</span>
                      </label>

                )}
                </div>
              </div>
              <button className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] transition-colors shadow-sm">
                Save Brief
              </button>
            </div>
          </div>
        }

        {/* Generated Tab */}
        {mainTab === 'generated' &&
        <div className="flex h-full overflow-hidden">
            {/* Left: Generation Studio */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 border-r border-[#E8E5DF]">
              {/* Gen Sub-tabs */}
              <div className="flex items-center gap-1.5 mb-6 bg-[#F5F4F0] p-1 rounded-lg w-fit">
                {(['concepts', 'copy', 'images'] as GenerationTab[]).map(
                (tab) =>
                <button
                  key={tab}
                  onClick={() => setGenTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${genTab === tab ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'}`}>

                      {tab}
                    </button>

              )}
              </div>

              {/* Prompt + Generate */}
              <div className="bg-white rounded-xl border border-[#E8E5DF] p-4 mb-6 shadow-card">
                <div className="flex items-start gap-3">
                  <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                  genTab === 'concepts' ?
                  'Describe your campaign direction, target audience, and key themes...' :
                  genTab === 'copy' ?
                  'Describe the tone, message, and format for your copy...' :
                  'Describe the visual style, subject, and mood for your images...'
                  }
                  rows={2}
                  className="flex-1 text-sm text-[#1C1917] bg-transparent border-0 focus:outline-none resize-none placeholder:text-[#78716C]" />

                  <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm flex-shrink-0">

                    <SparklesIcon className="w-4 h-4" />
                    {isGenerating ?
                  'Generating...' :
                  `Generate ${genTab.charAt(0).toUpperCase() + genTab.slice(1)}`}
                  </button>
                </div>
              </div>

              {/* Error State */}
              {hasError &&
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                  <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Generation failed
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      The model encountered an error. Please try again or adjust
                      your prompt.
                    </p>
                    <button
                  onClick={handleGenerate}
                  className="mt-2 text-xs font-medium text-red-700 underline hover:no-underline">

                      Try again
                    </button>
                  </div>
                </div>
            }

              {/* Concepts */}
              {genTab === 'concepts' &&
            <>
                  {isGenerating ?
              <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-4 h-4 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-[#78716C]">
                          Generating concepts...
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <SkeletonConceptCard />
                        <SkeletonConceptCard />
                        <SkeletonConceptCard />
                      </div>
                    </div> :

              <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-[#78716C]">
                          3 concepts generated
                        </p>
                        {selectedConcepts.size > 0 &&
                  <span className="text-xs font-medium text-[#0D9488]">
                            {selectedConcepts.size} selected
                          </span>
                  }
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ConceptCard
                    theme="Summer Freedom"
                    headlines={[
                    'Break Free This Summer',
                    'Your Summer, Unleashed']
                    }
                    visual="Bright, airy outdoor photography with natural light and open spaces"
                    selected={selectedConcepts.has(0)}
                    onSelect={() => toggleConcept(0)} />

                        <ConceptCard
                    theme="Athletic Energy"
                    headlines={['Push Your Limits', 'Every Step Counts']}
                    visual="Dynamic action shots with high contrast and motion blur"
                    selected={selectedConcepts.has(1)}
                    onSelect={() => toggleConcept(1)} />

                        <ConceptCard
                    theme="Urban Explorer"
                    headlines={['Own the City', 'Streets Are Yours']}
                    visual="Urban street photography with moody tones and architectural framing"
                    selected={selectedConcepts.has(2)}
                    onSelect={() => toggleConcept(2)} />

                      </div>
                      <button className="mt-4 flex items-center gap-2 text-sm font-medium text-[#0D9488] hover:underline">
                        <RefreshCwIcon className="w-3.5 h-3.5" />
                        Generate more concepts
                      </button>
                    </div>
              }
                </>
            }

              {/* Copy Tab */}
              {genTab === 'copy' && !isGenerating &&
            <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-[#E8E5DF] p-5 shadow-card">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
                        Copy Variant A
                      </span>
                      <StatusBadge status="approved" />
                    </div>
                    <p className="text-base font-bold text-[#1C1917] mb-2">
                      Discover Your Summer Story
                    </p>
                    <p className="text-sm text-[#78716C] leading-relaxed mb-3">
                      This season, Nike invites you to write your own adventure.
                      Whether you're hitting the trails at dawn or exploring
                      city streets at dusk, every step is a chapter in your
                      story.
                    </p>
                    <p className="text-sm font-semibold text-[#0D9488]">
                      → Shop the Collection
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E8E5DF] p-5 shadow-card">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
                        Copy Variant B
                      </span>
                      <StatusBadge status="draft" />
                    </div>
                    <p className="text-base font-bold text-[#1C1917] mb-2">
                      Summer Starts With You
                    </p>
                    <p className="text-sm text-[#78716C] leading-relaxed mb-3">
                      Don't wait for the perfect moment — create it. Nike's
                      Summer 2024 collection is built for those who move first
                      and think later.
                    </p>
                    <p className="text-sm font-semibold text-[#0D9488]">
                      → Explore Now
                    </p>
                  </div>
                  <button className="flex items-center gap-2 text-sm font-medium text-[#0D9488] hover:underline">
                    <RefreshCwIcon className="w-3.5 h-3.5" />
                    Generate more copy
                  </button>
                </div>
            }

              {/* Images Tab */}
              {genTab === 'images' && !isGenerating &&
            <div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                {
                  gradient: 'from-teal-400 to-cyan-500',
                  prompt: 'Athlete running on beach at golden hour',
                  status: 'approved' as const
                },
                {
                  gradient: 'from-amber-400 to-orange-500',
                  prompt: 'Urban street scene with Nike shoes',
                  status: 'in-review' as const
                },
                {
                  gradient: 'from-purple-400 to-indigo-500',
                  prompt: 'Minimalist product shot on white',
                  status: 'draft' as const
                }].
                map((img, i) =>
                <div
                  key={i}
                  className="bg-white rounded-xl border border-[#E8E5DF] shadow-card overflow-hidden">

                        <div
                    className={`h-36 bg-gradient-to-br ${img.gradient} flex items-center justify-center`}>

                          <ImageIcon className="w-10 h-10 text-white/60" />
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-[#78716C] mb-2 line-clamp-2">
                            {img.prompt}
                          </p>
                          <StatusBadge status={img.status} />
                        </div>
                      </div>
                )}
                  </div>
                  <button className="mt-4 flex items-center gap-2 text-sm font-medium text-[#0D9488] hover:underline">
                    <RefreshCwIcon className="w-3.5 h-3.5" />
                    Generate more images
                  </button>
                </div>
            }
            </div>

            {/* Right: Asset Sidebar */}
            <div className="w-72 flex-shrink-0 flex flex-col bg-white overflow-hidden">
              <div className="px-4 py-4 border-b border-[#E8E5DF]">
                <h3 className="text-sm font-semibold text-[#1C1917] mb-3">
                  Campaign Assets
                </h3>
                <div className="flex items-center gap-1 flex-wrap">
                  {(['All', 'Concepts', 'Copy', 'Images'] as const).map((f) =>
                <button
                  key={f}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#F5F4F0] text-[#78716C] hover:bg-[#E8E5DF] transition-colors">

                      {f}
                    </button>
                )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[#F5F4F0]">
                {assetRows.map((asset, i) => {
                const Icon = asset.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F4F0] transition-colors cursor-pointer">

                      <div className="w-7 h-7 rounded-lg bg-[#F5F4F0] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#78716C]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1C1917] truncate">
                          {asset.name}
                        </p>
                        <p className="text-[10px] text-[#78716C]">
                          {asset.time}
                        </p>
                      </div>
                      <StatusBadge
                      status={asset.status}
                      className="text-[9px] px-1.5 py-0.5" />

                    </div>);

              })}
              </div>
              <div className="p-4 border-t border-[#E8E5DF]">
                <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#0D9488] border border-[#0D9488] rounded-lg hover:bg-[#F0FDFA] transition-colors">
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add to campaign
                </button>
              </div>
            </div>
          </div>
        }

        {/* All Assets Tab */}
        {mainTab === 'assets' &&
        <div className="p-6 overflow-y-auto h-full scrollbar-thin">
            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#78716C]" />
                <input
                type="search"
                placeholder="Search assets..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all" />

              </div>
              <select className="px-3 py-2 text-sm bg-white border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 text-[#78716C]">
                <option>All Types</option>
                <option>Concepts</option>
                <option>Copy</option>
                <option>Images</option>
              </select>
              <select className="px-3 py-2 text-sm bg-white border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 text-[#78716C]">
                <option>All Statuses</option>
                <option>Draft</option>
                <option>In Review</option>
                <option>Approved</option>
              </select>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">
                <FilterIcon className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
            {
              gradient: 'from-teal-400 to-teal-600',
              name: 'Summer Freedom Concept',
              type: 'Concept',
              status: 'approved' as const
            },
            {
              gradient: 'from-purple-400 to-purple-600',
              name: 'Brand Voice Copy v3',
              type: 'Copy',
              status: 'in-review' as const
            },
            {
              gradient: 'from-amber-400 to-orange-500',
              name: 'Summer Vibes Hero',
              type: 'Image',
              status: 'submitted' as const
            },
            {
              gradient: 'from-blue-400 to-blue-600',
              name: 'Athletic Energy Concept',
              type: 'Concept',
              status: 'in-review' as const
            },
            {
              gradient: 'from-pink-400 to-rose-500',
              name: 'Hero Copy v1',
              type: 'Copy',
              status: 'changes-requested' as const
            },
            {
              gradient: 'from-green-400 to-emerald-600',
              name: 'Social Story Set',
              type: 'Image',
              status: 'approved' as const
            }].
            map((asset, i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E8E5DF] shadow-card overflow-hidden hover:shadow-card-hover transition-all cursor-pointer">

                  <div
                className={`h-28 bg-gradient-to-br ${asset.gradient} flex items-center justify-center`}>

                    <ImageIcon className="w-8 h-8 text-white/60" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-[#1C1917] mb-2">
                      {asset.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#78716C]">
                        {asset.type}
                      </span>
                      <StatusBadge status={asset.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">
                          SC
                        </span>
                      </div>
                      <span className="text-[11px] text-[#78716C]">
                        Sarah Chen · 2h ago
                      </span>
                    </div>
                  </div>
                </div>
            )}
            </div>
          </div>
        }
      </div>
    </div>);

}