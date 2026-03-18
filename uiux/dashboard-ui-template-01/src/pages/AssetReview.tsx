import React, { useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  ShareIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  MessageSquareIcon,
  CornerDownRightIcon,
  CheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon } from
'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
interface AssetReviewProps {
  onBack: () => void;
}
type DecisionModal = 'approve' | 'changes' | 'reject' | null;
export function AssetReview({ onBack }: AssetReviewProps) {
  const [activeModal, setActiveModal] = useState<DecisionModal>(null);
  const [approveNote, setApproveNote] = useState('');
  const [changesNote, setChangesNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [newComment, setNewComment] = useState('');
  const [resolvedCollapsed, setResolvedCollapsed] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [assetIndex, setAssetIndex] = useState(3);
  const totalAssets = 12;
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const handleDecision = (type: DecisionModal) => {
    setActiveModal(null);
    if (type === 'approve') showToast('Asset approved successfully');
    if (type === 'changes') showToast('Changes requested — creator notified');
    if (type === 'reject') showToast('Asset rejected');
  };
  return (
    <div className="flex flex-col h-[calc(100vh-60px)] relative">
      {/* Toast */}
      {toastMessage &&
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-[#1C1917] text-white rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2">
          <CheckCircleIcon className="w-4 h-4 text-[#0D9488]" />
          {toastMessage}
        </div>
      }

      {/* Modal Overlay */}
      {activeModal &&
      <div
        className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
        onClick={() => setActiveModal(null)}>

          <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true">

            {activeModal === 'approve' &&
          <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#1C1917]">
                      Approve Asset
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Brand Voice Copy v3
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#78716C] mb-4">
                  Add an optional note for the creator.
                </p>
                <textarea
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="Great work! This copy aligns well with our brand voice..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none mb-4" />

                <div className="flex gap-3">
                  <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">

                    Cancel
                  </button>
                  <button
                onClick={() => handleDecision('approve')}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">

                    Approve Asset
                  </button>
                </div>
              </>
          }

            {activeModal === 'changes' &&
          <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#1C1917]">
                      Request Changes
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Brand Voice Copy v3
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#78716C] mb-4">
                  Describe what needs to be changed. This will be sent to the
                  creator.
                </p>
                <textarea
              value={changesNote}
              onChange={(e) => setChangesNote(e.target.value)}
              placeholder="Please adjust the tone in paragraph 2 to be more aligned with our brand guidelines..."
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none mb-4" />

                <div className="flex gap-3">
                  <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">

                    Cancel
                  </button>
                  <button
                onClick={() => handleDecision('changes')}
                disabled={!changesNote.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                    Send Request
                  </button>
                </div>
              </>
          }

            {activeModal === 'reject' &&
          <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#1C1917]">
                      Reject Asset
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Brand Voice Copy v3
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#78716C] mb-4">
                  Please provide a reason for rejection. This is required.
                </p>
                <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="This asset does not meet our brand standards because..."
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none mb-4" />

                <div className="flex gap-3">
                  <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">

                    Cancel
                  </button>
                  <button
                onClick={() => handleDecision('reject')}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                    Reject Asset
                  </button>
                </div>
              </>
          }
          </div>
        </div>
      }

      <div className="flex flex-1 overflow-hidden">
        {/* Left Nav Strip */}
        <div className="w-12 flex-shrink-0 flex flex-col items-center justify-center gap-3 border-r border-[#E8E5DF] bg-white py-6">
          <button
            onClick={() => setAssetIndex(Math.max(1, assetIndex - 1))}
            disabled={assetIndex <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F4F0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous asset">

            <ChevronUpIcon className="w-4 h-4 text-[#78716C]" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-[#1C1917]">{assetIndex}</p>
            <div className="w-px h-4 bg-[#E8E5DF] mx-auto my-1" />
            <p className="text-xs text-[#78716C]">{totalAssets}</p>
          </div>
          <button
            onClick={() => setAssetIndex(Math.min(totalAssets, assetIndex + 1))}
            disabled={assetIndex >= totalAssets}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F4F0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next asset">

            <ChevronDownIcon className="w-4 h-4 text-[#78716C]" />
          </button>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {/* Asset Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#0D9488] transition-colors">

                <ArrowLeftIcon className="w-3.5 h-3.5" />
                Review Queue
              </button>
              <span className="text-[#E8E5DF]">/</span>
              <h1 className="text-base font-semibold text-[#1C1917]">
                Brand Voice Copy v3
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#F5F4F0] text-[#78716C] rounded-full">
                Nike Summer 2024
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#F0FDFA] text-[#0D9488] rounded-full">
                v3
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="in-review" />
              <button className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1917] transition-colors">
                <span>Next asset</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Copy Preview Card */}
          <div className="bg-white rounded-xl border border-[#E8E5DF] p-8 shadow-card mb-4">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 pb-6 border-b border-[#F5F4F0]">
                <p className="text-[10px] font-semibold text-[#78716C] uppercase tracking-widest mb-2">
                  Headline
                </p>
                <p className="text-2xl font-bold text-[#1C1917] leading-snug">
                  Discover Your Summer Story
                </p>
              </div>
              <div className="mb-6 pb-6 border-b border-[#F5F4F0]">
                <p className="text-[10px] font-semibold text-[#78716C] uppercase tracking-widest mb-2">
                  Body Copy
                </p>
                <p className="text-base text-[#1C1917] leading-relaxed">
                  This season, Nike invites you to write your own adventure.
                  Whether you're hitting the trails at dawn or exploring city
                  streets at dusk, every step is a chapter in your story. Summer
                  2024 — make it yours.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#78716C] uppercase tracking-widest mb-2">
                  CTA
                </p>
                <p className="text-base font-bold text-[#0D9488]">
                  Shop the Collection →
                </p>
              </div>
            </div>
          </div>

          {/* Asset Actions */}
          <div className="flex items-center gap-2 mb-8">
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">
              <CopyIcon className="w-3.5 h-3.5" />
              Copy to clipboard
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">
              <DownloadIcon className="w-3.5 h-3.5" />
              Download
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#78716C] border border-[#E8E5DF] rounded-lg hover:bg-[#F5F4F0] transition-colors">
              <ShareIcon className="w-3.5 h-3.5" />
              Share
            </button>
          </div>

          {/* Comments Thread */}
          <div className="bg-white rounded-xl border border-[#E8E5DF] shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E5DF]">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="w-4 h-4 text-[#78716C]" />
                <h2 className="text-sm font-semibold text-[#1C1917]">
                  Comments
                </h2>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#F5F4F0] text-[#78716C] rounded-full">
                  4
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#F5F4F0]">
              {/* Comment 1 */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">MW</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#1C1917]">
                        Marcus Webb
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">
                        Brand Approver
                      </span>
                      <span className="text-xs text-[#78716C]">2h ago</span>
                    </div>
                    <p className="text-sm text-[#1C1917] leading-relaxed mb-3">
                      The headline feels strong but the body copy needs more
                      brand voice alignment. Can we make it feel more empowering
                      and less narrative?
                    </p>
                    <div className="flex items-center gap-3">
                      <button className="text-xs font-medium text-[#78716C] hover:text-[#0D9488] transition-colors flex items-center gap-1">
                        <CornerDownRightIcon className="w-3 h-3" />
                        Reply
                      </button>
                      <button className="text-xs font-medium text-[#78716C] hover:text-[#0D9488] transition-colors flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        Resolve
                      </button>
                    </div>

                    {/* Reply */}
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-[#E8E5DF]">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[8px] font-bold">
                            SC
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[#1C1917]">
                              Sarah Chen
                            </span>
                            <span className="text-xs text-[#78716C]">
                              1h ago
                            </span>
                          </div>
                          <p className="text-sm text-[#78716C]">
                            Updated in v3 — does this work better? I've shifted
                            the tone to be more action-oriented.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolved Comment (collapsed) */}
              <div className="px-5 py-3">
                <button
                  onClick={() => setResolvedCollapsed(!resolvedCollapsed)}
                  className="flex items-center gap-2 text-xs text-[#78716C] hover:text-[#1C1917] transition-colors w-full">

                  <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                  <span className="font-medium">1 resolved comment</span>
                  <ChevronDownIcon
                    className={`w-3.5 h-3.5 ml-auto transition-transform ${resolvedCollapsed ? '' : 'rotate-180'}`} />

                </button>
                {!resolvedCollapsed &&
                <div className="mt-3 opacity-60">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[9px] font-bold">
                          PS
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#1C1917]">
                            Priya Sharma
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                            Team Member
                          </span>
                          <span className="text-xs text-[#78716C]">
                            30m ago
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                            Resolved
                          </span>
                        </div>
                        <p className="text-sm text-[#78716C]">
                          Love the CTA, very on-brand!
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-5 border-t border-[#E8E5DF] bg-[#FEFDFB]">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-bold">SC</span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E8E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none transition-all mb-2" />

                  <div className="flex justify-end">
                    <button
                      disabled={!newComment.trim()}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                      Post comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-[#E8E5DF] bg-white overflow-y-auto scrollbar-thin">
          {/* Asset Metadata */}
          <div className="p-5 border-b border-[#E8E5DF]">
            <h3 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-4">
              Asset Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78716C]">Campaign</span>
                <span className="text-xs font-medium text-[#1C1917]">
                  Nike Summer 2024
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78716C]">Creator</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">SC</span>
                  </div>
                  <span className="text-xs font-medium text-[#1C1917]">
                    Sarah Chen
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78716C]">Created</span>
                <span className="text-xs font-medium text-[#1C1917]">
                  Jan 18, 2024
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78716C]">Version</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#1C1917]">v3</span>
                  <button className="text-[10px] text-[#0D9488] hover:underline">
                    History
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78716C]">Type</span>
                <span className="text-xs font-medium text-[#1C1917]">Copy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78716C]">Status</span>
                <StatusBadge status="in-review" />
              </div>
            </div>
          </div>

          {/* Compliance Panel */}
          <div className="p-5 border-b border-[#E8E5DF]">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheckIcon className="w-4 h-4 text-[#78716C]" />
              <h3 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Compliance Check
              </h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-green-800">
                    Brand Voice Guidelines
                  </p>
                  <p className="text-[11px] text-green-700 mt-0.5">
                    Pass — Tone and language aligned
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    Trademark Usage
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Warning — Review "Nike" trademark placement in CTA
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-green-800">
                    Legal Disclaimers
                  </p>
                  <p className="text-[11px] text-green-700 mt-0.5">
                    Pass — No required disclaimers missing
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="w-4 h-4 text-[#78716C]" />
              <h3 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Status History
              </h3>
            </div>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#E8E5DF]" />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1C1917]">
                      Submitted for Review
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      Sarah Chen · 5h ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1C1917]">
                      Changes Requested
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      Marcus Webb · 3h ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1C1917]">
                      Revised &amp; Resubmitted
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      Sarah Chen · 2h ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F5F4F0] border-2 border-[#E8E5DF] flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#78716C]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#78716C]">
                      Awaiting Approval
                    </p>
                    <p className="text-[11px] text-[#78716C]">Now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Decision Bar */}
      <div className="flex-shrink-0 bg-white border-t border-[#E8E5DF] px-6 py-4 flex items-center justify-between shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 text-sm text-[#78716C]">
          <span className="font-medium text-[#1C1917]">
            Asset {assetIndex} of {totalAssets}
          </span>
          <span>·</span>
          <span>Nike Summer 2024</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('reject')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">

            <XCircleIcon className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={() => setActiveModal('changes')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors">

            <AlertTriangleIcon className="w-4 h-4" />
            Request Changes
          </button>
          <button
            onClick={() => setActiveModal('approve')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm">

            <CheckCircleIcon className="w-4 h-4" />
            Approve
          </button>
        </div>
      </div>
    </div>);

}