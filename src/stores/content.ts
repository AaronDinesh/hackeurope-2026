import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Constraint,
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
  setSectionData: <K extends SectionKey>(key: K, data: SectionMap[K]['data']) => void
  setSectionLoading: (key: SectionKey, isLoading: boolean) => void
  setSectionError: (key: SectionKey, error: string | null) => void
  addFinalOutput: (output: FinalOutput) => void
  replaceFinalOutput: (id: string, updater: Partial<FinalOutput>) => void
  clearContent: () => void
}

const initialState: SectionMap = {
  moodBoard: createSectionState<MoodBoardImage[]>([]),
  storyboard: createSectionState<StoryboardScene[]>([]),
  hexCodes: createSectionState<HexColor[]>([]),
  constraints: createSectionState<Constraint[]>([]),
  summary: createSectionState<SummaryDoc | null>(null),
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      finalOutputs: [],
      setSectionData: (key, data) =>
        set((state) => ({
          [key]: {
            ...state[key],
            data,
            updatedAt: Date.now(),
            error: null,
            isLoading: false,
          },
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
        set((state) => ({ finalOutputs: [output, ...state.finalOutputs] })),
      replaceFinalOutput: (id, updater) =>
        set((state) => ({
          finalOutputs: state.finalOutputs.map((item) =>
            item.id === id ? { ...item, ...updater } : item,
          ),
        })),
      clearContent: () => set({ ...initialState, finalOutputs: [] }),
    }),
    {
      name: 'content-cache',
      version: 1,
    },
  ),
)
