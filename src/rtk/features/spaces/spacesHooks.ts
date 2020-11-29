import { EntityId } from 'src/rtk/app/dto'
import { useFetchEntities } from 'src/rtk/app/hooksCommon'
import { fetchSpaces, selectSpaces } from './spacesSlice'

export const useFetchSpaces = (ids: EntityId[]) => {
  return useFetchEntities(selectSpaces, fetchSpaces, { ids })
}