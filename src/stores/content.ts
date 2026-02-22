import { create } from 'zustand'
import type {
  Constraint,
  ContentSnapshot,
  FinalOutput,
  HexColor,
  MoodBoardImage,
  SectionState,
  StoryboardScene,
  SummaryDoc,
} from '../types'

export type SectionKey = 'moodBoard' | 'storyboard' | 'hexCodes' | 'constraints' | 'summary'

type SectionMap = {
  moodBoard: SectionState<MoodBoardImage[]>
  storyboard: SectionState<StoryboardScene[]>
  hexCodes: SectionState<HexColor[]>
  constraints: SectionState<Constraint[]>
  summary: SectionState<SummaryDoc | null>
}

const createSectionState = <T,>(data: T): SectionState<T> => ({
  data,
  isLoading: false,
  error: null,
  updatedAt: null,
})

interface ContentStore extends SectionMap {
  finalOutputs: FinalOutput[]
  version: number
  setSectionData: <K extends SectionKey>(key: K, data: SectionMap[K]['data']) => void
  setSectionLoading: (key: SectionKey, isLoading: boolean) => void
  setSectionError: (key: SectionKey, error: string | null) => void
  addFinalOutput: (output: FinalOutput) => void
  replaceFinalOutput: (id: string, updater: Partial<FinalOutput>) => void
  setFinalOutputs: (outputs: FinalOutput[]) => void
  clearContent: () => void
  addConstraint: (constraint: Constraint) => void
  updateConstraint: (constraint: Constraint) => void
  removeConstraint: (id: string) => void
  getSnapshot: () => ContentSnapshot
  hydrateFromSnapshot: (snapshot: ContentSnapshot) => void
}

const initialState: SectionMap = {
  moodBoard: createSectionState<MoodBoardImage[]>([]),
  storyboard: createSectionState<StoryboardScene[]>([]),
  hexCodes: createSectionState<HexColor[]>([]),
  constraints: createSectionState<Constraint[]>([]),
  summary: createSectionState<SummaryDoc | null>(null),
}

export const useContentStore = create<ContentStore>()((set, get) => ({
  ...initialState,
  finalOutputs: [],
  version: 0,
  setSectionData: (key, data) =>
    set((state) => ({
      [key]: {
        ...state[key],
        data,
        updatedAt: Date.now(),
        error: null,
        isLoading: false,
      },
      version: state.version + 1,
    })),
  setSectionLoading: (key, isLoading) =>
    set((state) => ({
      [key]: { ...state[key], isLoading, error: isLoading ? null : state[key].error },
    })),
  setSectionError: (key, error) =>
    set((state) => ({
      [key]: { ...state[key], error, isLoading: false },
    })),
  addFinalOutput: (output) =>
    set((state) => ({
      finalOutputs: [output, ...state.finalOutputs],
      version: state.version + 1,
    })),
  replaceFinalOutput: (id, updater) =>
    set((state) => ({
      finalOutputs: state.finalOutputs.map((item) => (item.id === id ? { ...item, ...updater } : item)),
      version: state.version + 1,
    })),
  setFinalOutputs: (outputs) =>
    set((state) => ({
      finalOutputs: outputs,
      version: state.version + 1,
    })),
  clearContent: () => set({ ...initialState, finalOutputs: [], version: 0 }),
  addConstraint: (constraint) =>
    set((state) => ({
      constraints: {
        ...state.constraints,
        data: [constraint, ...state.constraints.data],
        updatedAt: Date.now(),
      },
      version: state.version + 1,
    })),
  updateConstraint: (constraint) =>
    set((state) => ({
      constraints: {
        ...state.constraints,
        data: state.constraints.data.map((item) => (item.id === constraint.id ? constraint : item)),
        updatedAt: Date.now(),
      },
      version: state.version + 1,
    })),
  removeConstraint: (id) =>
    set((state) => ({
      constraints: {
        ...state.constraints,
        data: state.constraints.data.filter((item) => item.id !== id),
        updatedAt: Date.now(),
      },
      version: state.version + 1,
    })),
  getSnapshot: () => {
    const state = get()
    return {
      moodBoard: state.moodBoard.data.map((item) => ({ ...item })),
      storyboard: state.storyboard.data.map((item) => ({ ...item })),
      hexCodes: state.hexCodes.data.map((item) => ({ ...item })),
      constraints: state.constraints.data.map((item) => ({ ...item })),
      summary: state.summary.data ? { ...state.summary.data } : null,
      finalOutputs: state.finalOutputs.map((item) => ({ ...item })),
    }
  },
  hydrateFromSnapshot: (snapshot) =>
    set((state) => ({
      moodBoard: { ...createSectionState(snapshot.moodBoard), updatedAt: Date.now() },
      storyboard: { ...createSectionState(snapshot.storyboard), updatedAt: Date.now() },
      hexCodes: { ...createSectionState(snapshot.hexCodes), updatedAt: Date.now() },
      constraints: { ...createSectionState(snapshot.constraints), updatedAt: Date.now() },
      summary: { ...createSectionState(snapshot.summary), updatedAt: Date.now() },
      finalOutputs: [...snapshot.finalOutputs],
      version: state.version + 1,
    })),
}))
