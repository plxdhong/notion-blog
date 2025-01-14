import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  NEXT_PUBLIC_URL,
  NEXT_PUBLIC_SITE_TITLE,
  NEXT_PUBLIC_SITE_DESCRIPTION,
  NUMBER_OF_POSTS_PER_PAGE,
} from '../../../../../../app/server-constants'
import GoogleAnalytics from '../../../../../../components/google-analytics'
import { colorClass } from '../../../../../../components/notion-block'
import {
  BlogPostLink,
  BlogTagLink,
  NextPageLink,
  NoContents,
  PostDate,
  PostExcerpt,
  PostTags,
  PostTitle,
  ReadMoreLink,
} from '../../../../../../components/blog-parts'
import {
  getPosts,
  getRankedPosts,
  getPostsByTagBefore,
  getFirstPostByTag,
  getAllTags,
} from '../../../../../../lib/notion/client'
import styles from '../../../../../../styles/blog.module.css'
import '../../../../../../styles/notion-color.css'

export const revalidate = 3600

export async function generateMetadata({ params: { date: encodedDate, tag: encodedTag } }): Promise<Metadata> {
  const date = decodeURIComponent(encodedDate)
  const tag = decodeURIComponent(encodedTag)
  const title = `Posts in ${tag} before ${date.split('T')[0]} - ${NEXT_PUBLIC_SITE_TITLE}`
  const description = NEXT_PUBLIC_SITE_DESCRIPTION
  const url = NEXT_PUBLIC_URL ? new URL('/blog', NEXT_PUBLIC_URL) : undefined
  const imageURL = new URL('/default.png', NEXT_PUBLIC_URL)

  const metadata: Metadata = {
    title: title,
    openGraph: {
      title: title,
      description: description,
      url: url,
      siteName: title,
      type: 'website',
      images: [{url: imageURL}],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [{url: imageURL}],
    },
    alternates: {
      canonical: url,
    },
  }

  return metadata
}

const BlogTagBeforeDatePage = async ({ params: { tag: encodedTag, date: encodedDate } }) => {
  const tag = decodeURIComponent(encodedTag)
  const date = decodeURIComponent(encodedDate)

  if (!Date.parse(date) || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
    notFound()
  }

  const [posts, firstPost, rankedPosts, recentPosts, tags] = await Promise.all([
    getPostsByTagBefore(tag, date, NUMBER_OF_POSTS_PER_PAGE),
    getFirstPostByTag(tag),
    getRankedPosts(),
    getPosts(5),
    getAllTags(),
  ])

  const currentTag = posts[0]?.Tags.find(t => t.name === tag)

  return (
    <>
      <GoogleAnalytics pageTitle={`Posts in ${tag} before ${date.split('T')[0]}`} />
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <header>
            <h2><span className={`tag ${currentTag && colorClass(currentTag.color)}`}>{tag}</span> before {date.split('T')[0]}</h2>
          </header>

          <NoContents contents={posts} />

          {posts.map(post => {
            return (
              <div className={styles.post} key={post.Slug}>
                <PostDate post={post} />
                <PostTags post={post} />
                <PostTitle post={post} />
                <PostExcerpt post={post} />
                <ReadMoreLink post={post} />
              </div>
            )
          })}

          <footer>
            <NextPageLink firstPost={firstPost} posts={posts} tag={tag} />
          </footer>
        </div>

        <div className={styles.subContent}>
          <BlogPostLink heading="Recommended" posts={rankedPosts} />
          <BlogPostLink heading="Latest Posts" posts={recentPosts} />
          <BlogTagLink heading="Categories" tags={tags} />
        </div>
      </div>
    </>
  )
}

export default BlogTagBeforeDatePage
