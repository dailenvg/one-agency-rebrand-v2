import type { ComponentType } from 'react'
import type { Concept } from '../../data/concepts'
import { modeOn } from '../../lib/logos'
import type { ReelSceneId } from '../../lib/reel'
import type { SceneProps } from './scene-kit'
import {
  CardScene,
  ConstructionScene,
  DockScene,
  GradientScene,
  GuidesScene,
  ProfileScene,
  SkylineScene,
  StepsScene,
  StoryScene,
  WebScene,
} from './scenes'
import { ArcChartScene, ArcRiseScene, ArcTurnsScene } from './signature/arc-scenes'
import { NovaCornerScene, NovaFramesScene, NovaOrbitScene } from './signature/nova-scenes'
import { PillCapsulesScene, PillFunnelScene, PillToggleScene } from './signature/pill-scenes'
import { VoltFieldScene, VoltRevealScene, VoltSpotlightScene } from './signature/volt-scenes'
import type { MarkLook } from './stage'

interface SceneDef {
  Scene: ComponentType<SceneProps>
  /** Mark artwork for the scene, chosen so it always has contrast with what sits behind it. */
  mark: (c: Concept) => MarkLook
}

const on = (bg: string): MarkLook => ({ mode: modeOn(bg) })
/** The mark as the brand app icon: favicon colours, on a tile or avatar disc. */
const app = (plate: MarkLook['plate']) => (c: Concept): MarkLook => ({ mode: c.favicon.mode, recolor: c.favicon.recolor, plate })

export const scenes: Record<ReelSceneId, SceneDef> = {
  skyline: { Scene: SkylineScene, mark: (c) => on(c.theme.dark.heroBg) },
  dock: { Scene: DockScene, mark: app('tile') },
  steps: { Scene: StepsScene, mark: (c) => on(c.theme.light.accent) },
  guides: { Scene: GuidesScene, mark: (c) => on(c.theme.light.surface) },
  web: { Scene: WebScene, mark: (c) => on(c.theme.light.bg) },
  card: { Scene: CardScene, mark: app('tile') },
  gradient: { Scene: GradientScene, mark: (c) => on(c.theme.dark.heroBg) },
  profile: { Scene: ProfileScene, mark: (c) => on(c.theme.dark.surface) },
  construction: { Scene: ConstructionScene, mark: (c) => on(c.theme.dark.heroBg) },
  story: { Scene: StoryScene, mark: app('circle') },

  'nova-orbit': { Scene: NovaOrbitScene, mark: (c) => on(c.theme.dark.heroBg) },
  'nova-frames': { Scene: NovaFramesScene, mark: (c) => on(c.theme.light.surface) },
  'nova-corner': { Scene: NovaCornerScene, mark: (c) => on(c.theme.dark.heroBg) },

  'volt-field': { Scene: VoltFieldScene, mark: (c) => on(c.theme.dark.heroBg) },
  'volt-spotlight': { Scene: VoltSpotlightScene, mark: (c) => on(c.theme.dark.accent) },
  'volt-reveal': { Scene: VoltRevealScene, mark: (c) => on(c.theme.dark.heroBg) },

  'arc-rise': { Scene: ArcRiseScene, mark: (c) => on(c.theme.dark.bg) },
  'arc-turns': { Scene: ArcTurnsScene, mark: (c) => on(c.theme.light.accent) },
  'arc-chart': { Scene: ArcChartScene, mark: (c) => on(c.theme.dark.heroBg) },

  'pill-capsules': { Scene: PillCapsulesScene, mark: (c) => on(c.theme.dark.heroBg) },
  'pill-funnel': { Scene: PillFunnelScene, mark: (c) => on(c.theme.light.surface) },
  'pill-toggle': { Scene: PillToggleScene, mark: (c) => on(c.theme.dark.heroBg) },
}
