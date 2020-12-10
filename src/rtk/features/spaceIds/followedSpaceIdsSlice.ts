import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { FetchOneArgs, ThunkApiConfig } from 'src/rtk/app/helpers'
import { SelectOneFn } from 'src/rtk/app/hooksCommon'
import { RootState } from 'src/rtk/app/rootReducer'
import { SpaceId, AccountId } from 'src/types'
import { bnsToIds } from 'src/types/utils'

export type SpaceIdsFollowedByAccount = {
  /** `id` is an account id that follows spaces. */
  id: AccountId
  followedSpaceIds: SpaceId[]
}

const adapter = createEntityAdapter<SpaceIdsFollowedByAccount>()

const spacesSelectors = adapter.getSelectors<RootState>(state => state.followedSpaceIds)

// Rename the exports for readability in component usage
export const {
  // selectById: selectSpaceIdsFollowedByAccount,
  selectIds: selectAllSpaceFollowers,
  // selectEntities: selectFollowedSpaceIdsEntities,
  // selectAll: selectAllFollowedSpaceIds,
  // selectTotal: selectTotalSpaceFollowers
} = spacesSelectors

export const _selectSpaceIdsOwnedByAccount:
  SelectOneFn<Args, SpaceIdsFollowedByAccount | undefined> = (
    state, 
    { id: follower }
  ) =>
    spacesSelectors.selectById(state, follower)

export const selectSpaceIdsOwnedByAccount = (state: RootState, id: AccountId) => 
_selectSpaceIdsOwnedByAccount(state, { id })?.followedSpaceIds || []

type Args = {}

type FetchOneSpaceIdsArgs = FetchOneArgs<Args>

type FetchOneRes = SpaceIdsFollowedByAccount | undefined

export const fetchSpaceIdsOwnedByAccount = createAsyncThunk
  <FetchOneRes, FetchOneSpaceIdsArgs, ThunkApiConfig>(
  'followedSpaceIds/fetchOne',
  async ({ api, id }, { getState }) => {

    const follower = id as AccountId
    const knownSpaceIds = selectSpaceIdsOwnedByAccount(getState(), follower)
    const isKnownFollower = typeof knownSpaceIds !== 'undefined'
    if (isKnownFollower) {
      // Nothing to load: space ids followed by this account are already loaded.
      return undefined
    }

    const spaceIds = await api.substrate.spaceIdsFollowedByAccount(follower)

    return {
      id: follower,
      followedSpaceIds: bnsToIds(spaceIds)
    }
  }
)

const slice = createSlice({
  name: 'followedSpaceIds',
  initialState: adapter.getInitialState(),
  reducers: {
    upsertFollowedSpaceIdsByAccount: adapter.upsertOne,
  },
  extraReducers: builder => {
    builder.addCase(fetchSpaceIdsOwnedByAccount.fulfilled, (state, { payload }) => {
      if (payload) adapter.upsertOne(state, payload)
    })
  }
})

export const {
  upsertFollowedSpaceIdsByAccount,
} = slice.actions

export default slice.reducer
