import React, { useState } from 'react';
import {
  ClipboardListIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ImageIcon,
  FileTextIcon,
  LayersIcon,
  EyeIcon } from
'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
type StatusVariant =
'draft' |
'agency-review' |
'submitted' |
'in-review' |
'changes-requested' |
'approved' |
'rejected';
interface DashboardProps {
  onNavigateToCampaign: () => void;
  onNavigateToReview: () => void;
}
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E5DF] p-6 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-[#F5F4F0] rounded animate-pulse" />
          <div className="h-8 w-16 bg-[#F5F4F0] rounded animate-pulse" />
          <div className="h-3 w-32 bg-[#F5F4F0] rounded animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-[#F5F4F0] rounded-lg animate-pulse" />
      </div>
    </div>);

}
function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="h-3 w-36 bg-[#F5F4F0] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-28 bg-[#F5F4F0] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-12 bg-[#F5F4F0] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 bg-[#F5F4F0] rounded-full animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-6 w-14 bg-[#F5F4F0] rounded animate-pulse" />
      </td>
    </tr>);

}
export function Dashboard({
  onNavigateToCampaign,
  onNavigateToReview
}: DashboardProps) {
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty'>(
    'normal'
  );
  const pendingReviews: {
    name: string;
    campaign: string;
    age: string;
    status: StatusVariant;
  }[] = [
  {
    name: 'Summer Vibes Hero',
    campaign: 'Nike Summer 2024',
    age: '2h ago',
    status: 'in-review'
  },
  {
    name: 'Brand Voice Copy v3',
    campaign: 'Spotify Wrapped',
    age: '5h ago',
    status: 'changes-requested'
  },
  {
    name: 'Product Launch Banner',
    campaign: 'Apple Vision',
    age: '1d ago',
    status: 'submitted'
  },
  {
    name: 'Holiday Campaign Concept',
    campaign: 'Coca-Cola Holiday',
    age: '2d ago',
    status: 'in-review'
  },
  {
    name: 'Social Media Pack',
    campaign: 'Adidas Originals',
    age: '3d ago',
    status: 'submitted'
  }];

  const approvedAssets = [
  {
    name: 'Summer Hero',
    type: 'Image',
    gradient: 'from-teal-400 to-teal-600'
  },
  {
    name: 'Brand Copy v2',
    type: 'Copy',
    gradient: 'from-purple-400 to-purple-600'
  },
  {
    name: 'Product Banner',
    type: 'Image',
    gradient: 'from-amber-400 to-orange-500'
  },
  {
    name: 'Social Pack',
    type: 'Image',
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    name: 'Launch Concept',
    type: 'Concept',
    gradient: 'from-pink-400 to-rose-500'
  },
  {
    name: 'Holiday Spot',
    type: 'Copy',
    gradient: 'from-green-400 to-emerald-600'
  }];

  return (
    <div className="p-8 max-w-[1280px] mx-auto">
      {/* State Switcher (demo) */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-[#78716C] font-medium">View state:</span>
        {(['normal', 'loading', 'empty'] as const).map((s) =>
        <button
          key={s}
          onClick={() => setViewState(s)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${viewState === s ? 'bg-[#0D9488] text-white' : 'bg-[#F5F4F0] text-[#78716C] hover:bg-[#E8E5DF]'}`}>

            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        )}
      </div>

      {/* Empty State */}
      {viewState === 'empty' &&
      <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#F0FDFA] flex items-center justify-center mb-6">
            <SparklesIcon className="w-10 h-10 text-[#0D9488]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-2">
            No campaigns yet
          </h2>
          <p className="text-[#78716C] text-sm max-w-sm mb-8">
            Create your first campaign to start generating brand-grounded
            creative assets and routing them through approval.
          </p>
          <button
          onClick={onNavigateToCampaign}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] transition-colors shadow-sm">

            <SparklesIcon className="w-4 h-4" />
            Create your first campaign
          </button>
        </div>
      }

      {/* Loading State */}
      {viewState === 'loading' &&
      <>
          <div className="grid grid-cols-4 gap-5 mb-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3 bg-white rounded-xl border border-[#E8E5DF] shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E5DF]">
                <div className="h-4 w-32 bg-[#F5F4F0] rounded animate-pulse" />
              </div>
              <table className="w-full">
                <tbody>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </tbody>
              </table>
            </div>
            <div className="col-span-2 space-y-4">
              {[1, 2, 3].map((i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E8E5DF] p-4 shadow-card">

                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-[#F5F4F0] rounded animate-pulse" />
                    <div className="h-3 w-24 bg-[#F5F4F0] rounded animate-pulse" />
                    <div className="h-2 w-full bg-[#F5F4F0] rounded-full animate-pulse mt-3" />
                  </div>
                </div>
            )}
            </div>
          </div>
        </>
      }

      {/* Normal State */}
      {viewState === 'normal' &&
      <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {/* Pending Reviews */}
            <div className="bg-white rounded-xl border border-[#E8E5DF] p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide mb-1">
                    Pending Reviews
                  </p>
                  <p className="text-3xl font-bold text-[#1C1917]">12</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <p className="text-xs text-amber-600 font-medium">
                      3 urgent
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] flex items-center justify-center flex-shrink-0">
                  <ClipboardListIcon className="w-5 h-5 text-[#0D9488]" />
                </div>
              </div>
              <button
              onClick={onNavigateToReview}
              className="text-xs font-medium text-[#0D9488] hover:underline flex items-center gap-1">

                View queue <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Generated This Week */}
            <div className="bg-white rounded-xl border border-[#E8E5DF] p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide mb-1">
                    Generated This Week
                  </p>
                  <p className="text-3xl font-bold text-[#1C1917]">47</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUpIcon className="w-3 h-3 text-purple-600" />
                    <p className="text-xs text-purple-600 font-medium">
                      +18% vs last week
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <button
              onClick={onNavigateToCampaign}
              className="text-xs font-medium text-purple-600 hover:underline flex items-center gap-1">

                View assets <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Approval Rate */}
            <div className="bg-white rounded-xl border border-[#E8E5DF] p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide mb-1">
                    Approval Rate
                  </p>
                  <p className="text-3xl font-bold text-[#1C1917]">84%</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUpIcon className="w-3 h-3 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">
                      ↑ 6% this month
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="w-full bg-[#F5F4F0] rounded-full h-1.5">
                <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{
                  width: '84%'
                }} />

              </div>
            </div>

            {/* Avg Time to Approval */}
            <div className="bg-white rounded-xl border border-[#E8E5DF] p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide mb-1">
                    Avg Time to Approval
                  </p>
                  <p className="text-3xl font-bold text-[#1C1917]">2.3d</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingDownIcon className="w-3 h-3 text-amber-600" />
                    <p className="text-xs text-amber-600 font-medium">
                      ↓ 0.4d improvement
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-[#78716C]">Target: 2.0d</p>
            </div>
          </div>

          {/* Middle Row */}
          <div className="grid grid-cols-5 gap-6 mb-8">
            {/* Pending Reviews Table */}
            <div className="col-span-3 bg-white rounded-xl border border-[#E8E5DF] shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E5DF]">
                <h2 className="text-sm font-semibold text-[#1C1917]">
                  Pending Reviews
                </h2>
                <button
                onClick={onNavigateToReview}
                className="text-xs font-medium text-[#0D9488] hover:underline flex items-center gap-1">

                  View all <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table
                className="w-full"
                role="table"
                aria-label="Pending reviews">

                  <thead>
                    <tr className="bg-[#FEFDFB]">
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#78716C] uppercase tracking-wide">
                        Asset
                      </th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#78716C] uppercase tracking-wide">
                        Campaign
                      </th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#78716C] uppercase tracking-wide">
                        Age
                      </th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#78716C] uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#78716C] uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F4F0]">
                    {pendingReviews.map((row, i) =>
                  <tr
                    key={i}
                    className="hover:bg-[#F0FDFA] transition-colors cursor-pointer group">

                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-[#1C1917] group-hover:text-[#0D9488] transition-colors">
                            {row.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#78716C]">
                            {row.campaign}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#78716C]">
                            {row.age}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                        onClick={onNavigateToReview}
                        className="px-3 py-1 text-xs font-medium text-[#0D9488] border border-[#0D9488] rounded-lg hover:bg-[#F0FDFA] transition-colors">

                            Review
                          </button>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[#1C1917]">
                  Recent Campaigns
                </h2>
                <button
                onClick={onNavigateToCampaign}
                className="text-xs font-medium text-[#0D9488] hover:underline flex items-center gap-1">

                  View all <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>

              {/* Campaign Card 1 */}
              <div
              className="bg-white rounded-xl border border-[#E8E5DF] p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
              onClick={onNavigateToCampaign}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateToCampaign()}>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0D9488] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#0D9488] transition-colors truncate">
                      Nike Summer 2024
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-[#F0FDFA] text-[#0D9488] rounded-full">
                        Social
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full">
                        Display
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#78716C] whitespace-nowrap">
                    2h ago
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#78716C]">Progress</span>
                    <span className="text-[11px] font-medium text-[#1C1917]">
                      75%
                    </span>
                  </div>
                  <div className="w-full bg-[#F5F4F0] rounded-full h-1.5">
                    <div
                    className="bg-[#0D9488] h-1.5 rounded-full transition-all"
                    style={{
                      width: '75%'
                    }} />

                  </div>
                </div>
              </div>

              {/* Campaign Card 2 */}
              <div
              className="bg-white rounded-xl border border-[#E8E5DF] p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
              onClick={onNavigateToCampaign}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateToCampaign()}>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#0D9488] transition-colors truncate">
                      Spotify Wrapped
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full">
                        Audio
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-pink-50 text-pink-600 rounded-full">
                        Social
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#78716C] whitespace-nowrap">
                    1d ago
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#78716C]">Progress</span>
                    <span className="text-[11px] font-medium text-[#1C1917]">
                      45%
                    </span>
                  </div>
                  <div className="w-full bg-[#F5F4F0] rounded-full h-1.5">
                    <div
                    className="bg-purple-500 h-1.5 rounded-full"
                    style={{
                      width: '45%'
                    }} />

                  </div>
                </div>
              </div>

              {/* Campaign Card 3 */}
              <div
              className="bg-white rounded-xl border border-[#E8E5DF] p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
              onClick={onNavigateToCampaign}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateToCampaign()}>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#0D9488] transition-colors truncate">
                      Apple Vision Pro Launch
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full">
                        Video
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
                        OOH
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#78716C] whitespace-nowrap">
                    3d ago
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#78716C]">Progress</span>
                    <span className="text-[11px] font-medium text-[#1C1917]">
                      20%
                    </span>
                  </div>
                  <div className="w-full bg-[#F5F4F0] rounded-full h-1.5">
                    <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{
                      width: '20%'
                    }} />

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Approved Assets Strip */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#1C1917]">
                Approved Assets
              </h2>
              <button className="text-xs font-medium text-[#0D9488] hover:underline flex items-center gap-1">
                View Library <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {approvedAssets.map((asset, i) =>
            <div
              key={i}
              className="flex-shrink-0 w-44 bg-white rounded-xl border border-[#E8E5DF] shadow-card hover:shadow-card-hover transition-all cursor-pointer group overflow-hidden">

                  <div
                className={`h-24 bg-gradient-to-br ${asset.gradient} flex items-center justify-center`}>

                    {asset.type === 'Image' &&
                <ImageIcon className="w-8 h-8 text-white/70" />
                }
                    {asset.type === 'Copy' &&
                <FileTextIcon className="w-8 h-8 text-white/70" />
                }
                    {asset.type === 'Concept' &&
                <LayersIcon className="w-8 h-8 text-white/70" />
                }
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <EyeIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-[#1C1917] truncate mb-1">
                      {asset.name}
                    </p>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-green-50 text-green-700 rounded-full">
                      {asset.type}
                    </span>
                  </div>
                </div>
            )}
            </div>
          </div>
        </>
      }
    </div>);

}