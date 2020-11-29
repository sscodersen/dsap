import { Option } from '@polkadot/types'
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { SocialAccount } from '@subsocial/types/substrate/interfaces'
import { createFetchOne, createFilterNewIds, FetchManyArgs, SelectManyArgs, selectManyByIds, ThunkApiConfig } from 'src/rtk/app/helpers'
import { getUniqueContentIds, ProfileStruct, flattenProfileStructs, SocialAccountWithId } from 'src/rtk/app/flatteners'
import { RootState } from 'src/rtk/app/rootReducer'
import { asString } from 'src/utils'
import { fetchContents, selectProfileContentById } from '../contents/contentsSlice'
import { ProfileData } from 'src/rtk/app/dto'

const profilesAdapter = createEntityAdapter<ProfileStruct>()

const profilesSelectors = profilesAdapter.getSelectors<RootState>(state => state.profiles)

// Rename the exports for readability in component usage
export const {
  selectById: selectProfileStructById,
  selectIds: selectProfileIds,
  selectEntities: selectProfileEntities,
  selectAll: selectAllProfiles,
  selectTotal: selectTotalProfiles
} = profilesSelectors

type Args = {
  withContent?: boolean
}

type SelectArgs = SelectManyArgs<Args>

type FetchArgs = FetchManyArgs<Args>

// export const selectProfile = (state: RootState, id: EntityId): ProfileData | undefined =>
//   selectOneById(state, id, selectProfileStructById, selectProfileContentById)

export const selectProfiles = (state: RootState, { ids }: SelectArgs): ProfileData[] =>
  selectManyByIds(state, ids, selectProfileStructById, selectProfileContentById)

const filterNewIds = createFilterNewIds(selectProfileIds)

export const fetchProfiles = createAsyncThunk<ProfileStruct[], FetchArgs, ThunkApiConfig>(
  'profiles/fetchMany',
  async ({ api, ids: accountIds, withContent = true }, { getState, dispatch }) => {

    const ids = accountIds.map(asString)
    const newIds = filterNewIds(getState(), ids)
    if (!newIds.length) {
      // Nothing to load: all ids are known and their profiles are already loaded.
      return []
    }

    // TODO rewrite: findSocialAccounts should return SocialAccount with id: AccountId
    // const structs = await api.substrate.findSocialAccounts(newIds)

    const substrateApi = await api.substrate.api
    const structs = await substrateApi.query.profiles
      .socialAccountById.multi(newIds) as Option<SocialAccount>[]

    const structWithIdArr: SocialAccountWithId[] = []

    structs.forEach((structOpt, i) => {
      if (structOpt.isSome) {
        structWithIdArr.push({
          id: ids[i],
          struct: structOpt.unwrap()
        })
      }
    })
    
    const entities = flattenProfileStructs(structWithIdArr)
    const fetches: Promise<any>[] = []

    if (withContent) {
      const ids = getUniqueContentIds(entities)
      if (ids.length) {
        fetches.push(dispatch(fetchContents({ api, ids })))
      }
    }

    await Promise.all(fetches)

    return entities
  }
)

export const fetchProfile = createFetchOne(fetchProfiles)

const profiles = createSlice({
  name: 'profiles',
  initialState: profilesAdapter.getInitialState(),
  reducers: {
    updateProfile: profilesAdapter.updateOne
  },
  extraReducers: builder => {
    builder.addCase(fetchProfiles.fulfilled, profilesAdapter.upsertMany)
    // builder.addCase(fetchProfiles.rejected, (state, action) => {
    //   state.error = action.error
    // })
  }
})

export default profiles.reducer