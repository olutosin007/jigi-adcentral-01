/**
 * Campaign Context Object (CCO) — Public API
 */

export {
  campaignContextObjectSchema,
  strategicContextSchema,
  audienceContextSchema,
  channelConstraintSchema,
  toneProfileSchema,
  hardConstraintsSchema,
  referenceAssetSchema,
  assetLineageSchema,
  demographicCuesSchema,
  imageDimensionsSchema,
  copyLimitsSchema,
} from './schema'

export type {
  CampaignContextObject,
  StrategicContext,
  AudienceContext,
  ChannelConstraint,
  ToneProfile,
  HardConstraints,
  ReferenceAsset,
  AssetLineage,
  GoalType,
  LanguageRegister,
  ContentType,
  ReferenceAssetClassification,
  ApplicableTrack,
  DemographicCues,
  ImageDimensions,
  CopyLimits,
} from './schema'

export {
  persistCCO,
  fetchCCO,
  fetchCCOVersion,
  buildAssetLineage,
} from './services'

export {
  GOAL_TYPE,
  LANGUAGE_REGISTER,
  CONTENT_TYPE,
  REFERENCE_ASSET_CLASSIFICATION,
  APPLICABLE_TRACK,
} from './schema'
