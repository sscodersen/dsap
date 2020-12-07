import React, { FC, useState } from 'react'
import { CaretDownOutlined, CaretUpOutlined, CommentOutlined, NotificationOutlined } from '@ant-design/icons'
import { Comment, Button, Tag } from 'antd'
import { asCommentData, asCommentStruct, PostWithSomeDetails } from 'src/types'
import { CommentContent } from '@subsocial/types'
import { AuthorPreview } from '../profiles/address-views/AuthorPreview'
import Link from 'next/link'
import { Pluralize, pluralize } from '../utils/Plularize'
import { formatUnixDate, IconWithLabel, isHidden } from '../utils'
import dayjs from 'dayjs'
import { EditComment } from './UpdateComment'
import { NewComment } from './CreateComment'
import { VoterButtons } from '../voting/VoterButtons'
import { PostDropDownMenu } from '../posts/view-post'
import { CommentBody } from './helpers'
import { equalAddresses } from '../substrate'
import { postUrl } from '../urls'
import { ShareDropdown } from '../posts/share/ShareDropdown'
import { PostStruct, SpaceStruct } from 'src/types'
import { ViewCommentsTree } from './CommentTree'

type Props = {
  space: SpaceStruct,
  rootPost?: PostStruct,
  comment: PostWithSomeDetails,
  withShowReplies?: boolean
}

export const ViewComment: FC<Props> = (props) => {

  const {
    space = { id: 0 } as any as SpaceStruct,
    rootPost,
    comment,
    withShowReplies = true
  } = props

  const {
    post: postData,
    owner
  } = comment

  if (isHidden(postData)) return null

  const commentStruct = asCommentStruct(postData.struct)
  const commentContent = postData.content as CommentContent

  const {
    id,
    createdAtTime,
    ownerId,
    score,
    repliesCount: initialRepliesCount
  } = commentStruct

  const [ showEditForm, setShowEditForm ] = useState(false)
  const [ showReplyForm, setShowReplyForm ] = useState(false)
  const [ repliesCount, setRepliesCount ] = useState(initialRepliesCount)
  
  const hasReplies = repliesCount > 0
  const [ showReplies, setShowReplies ] = useState(withShowReplies && hasReplies)

  const isFake = id.startsWith('fake')
  const commentLink = postUrl(space, comment.post)
  const isRootPostOwner = equalAddresses(rootPost?.ownerId, commentStruct.ownerId)

  const ViewRepliesLink = () => {
    const viewActionMessage = showReplies
      ? <><CaretUpOutlined /> {'Hide'}</>
      : <><CaretDownOutlined /> {'View'}</>

    return <>
      <Link href={commentLink}>
        <a onClick={(event) => { event.preventDefault(); setShowReplies(!showReplies) }}>
          {viewActionMessage}{' '}
          <Pluralize count={repliesCount} singularText='reply' pluralText='replies' />
        </a>
      </Link>
    </>
  }

  const commentAuthor = (
    <div className='DfAuthorBlock'>
      <AuthorPreview
        address={ownerId}
        owner={owner}
        isShort={true}
        isPadded={false}
        size={32}
        afterName={isRootPostOwner
          ? <Tag color='blue'><NotificationOutlined /> Post author</Tag>
          : undefined
        }
        details={
          <span>
            <Link href='/[spaceId]/[slug]' as={commentLink}>
              <a className='DfGreyLink'>{dayjs(formatUnixDate(createdAtTime)).fromNow()}</a>
            </Link>
            {' · '}
            {pluralize(score, 'Point')}
          </span>
        }
      />
      <PostDropDownMenu key={`comment-dropdown-menu-${id}`} post={comment.post} space={space} />
    </div>
  )

  const newCommentForm = showReplyForm &&
    <NewComment
      post={commentStruct}
      callback={(id) => {
        setShowReplyForm(false)
        id && setRepliesCount(repliesCount + 1)
      }}
      withCancel
    />

  const actionCss = 'DfCommentAction'

  return <div className={isFake ? 'DfDisableLayout' : ''}>
    <Comment
      className='DfNewComment'
      actions={isFake ? [] : [
        <VoterButtons key={`voters-of-comments-${id}`} post={commentStruct} className={actionCss} />,
        <Button key={`reply-comment-${id}`} className={actionCss} onClick={() => setShowReplyForm(true)}>
          <IconWithLabel icon={<CommentOutlined />} label='Reply' />
        </Button>,
        <ShareDropdown key={`dropdown-comment-${id}`} postDetails={comment} space={space} className={actionCss} />
      ]}
      author={commentAuthor}
      content={showEditForm
        ? <EditComment struct={commentStruct} content={commentContent} callback={() => setShowEditForm(false)}/>
        : <CommentBody comment={asCommentData(comment.post)} />
      }
    >
      <div>
        {newCommentForm}
        {hasReplies && <>
          {!withShowReplies && <ViewRepliesLink />}
          {showReplies &&
            <ViewCommentsTree space={space} rootPost={rootPost} parentId={commentStruct.id} />
          }
        </>}
      </div>
    </Comment>
  </div>
}

export default ViewComment
