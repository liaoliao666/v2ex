import { Cheerio, CheerioAPI, Element } from 'cheerio'
import { defaultTo } from 'lodash-es'
import { isString } from 'twrnc/dist/esm/types'

import { RecentTopic } from '@/jotai/recentTopicsAtom'
import { invoke } from '@/utils/invoke'
import { getURLSearchParams } from '@/utils/url'

import { Member, Node, Profile, Reply, Topic } from './types'

export function parseTimestamp(timestamp: string) {
  return timestamp?.replace(` +08:00`, ``)
}

export function parseVia(via: string) {
  if (!via) return ''
  if (via.includes('iPhone')) return 'iPhone'
  if (via.includes('Android')) return 'Android'
  return undefined
}

export function getNextPageParam(data: { page: number; last_page: number }) {
  return data.last_page > data.page ? data.page + 1 : undefined
}

export function parseLastPage($: CheerioAPI) {
  return parseInt($('.page_input').attr('max') || '1', 10)
}

export function isLogined($: CheerioAPI) {
  return !!$('#Top > div > div > div.tools > a:last')
    .attr('onclick')
    ?.includes('signout')
}

export function parseNodeByATag(
  $node: Cheerio<Element>
): Pick<Node, 'name' | 'title'> {
  return {
    name: $node.attr('href')?.replace('/go/', '').trim()!,
    title: $node.text(),
  }
}

export function parseTopicByATag(
  $topic: Cheerio<Element>
): Pick<Topic, 'id' | 'title' | 'reply_count'> {
  const [id, replies] = $topic.attr('href')!.match(/\d+/g)!.map(Number)

  return {
    id,
    title: $topic.text(),
    reply_count: replies || 0,
  }
}

export function parseBalance(
  $el: Cheerio<Element>,
  selector: string
): {
  gold: number
  silver: number
  bronze: number
} {
  const balanceHtml = $el.find(selector).html()

  return Object.fromEntries(
    ['gold', 'silver', 'bronze'].map(level => [
      level,
      defaultTo(
        +(balanceHtml?.match(
          new RegExp(`(\\d+)\\s\\<img\\ssrc="\\/static\\/img\\/${level}`)
        )?.[1] as string),
        undefined
      ),
    ])
  ) as {
    gold: number
    silver: number
    bronze: number
  }
}

export function parseTopicItems($: CheerioAPI, selector: string): Topic[] {
  const ignores = new Set(
    $.text()
      .match(/ignored_topics\s=\s\[(.+)\]/)?.[1]
      ?.split(',')
      .map(Number)
  )
  const blockers = new Set(
    $.text()
      .match(/blocked\s=\s\[(.+)\]/)?.[1]
      ?.split(',')
      .map(Number)
  )

  return $(selector)
    .map((i, table) => {
      const $this = $(table)
      const $topicItem = $this.find('table > tbody > tr:first-child')
      const $topicInfo = $topicItem.find('.topic_info')
      const topic = parseTopicByATag($topicItem.find('.item_title a'))

      if (ignores.has(topic.id)) return
      if (blockers.has(Number($this.attr('class')?.match(/from_(\d+)/)?.[1])))
        return

      return {
        ...invoke(() => {
          const $node = $topicItem.find('.node')
          const hasNode = !!$node.attr('href')

          let node
          let last_touched: string

          if (hasNode) {
            node = {
              name: $node.attr('href')?.replace('/go/', '').trim(),
              title: $node.text(),
            }
            last_touched = parseTimestamp(
              $topicInfo.children(':nth-child(4)').attr('title')!
            )
          } else {
            last_touched = parseTimestamp(
              $topicInfo.children(':nth-child(2)').attr('title')!
            )
          }

          return {
            node,
            last_touched,
          }
        }),
        ...topic,
        member: {
          username: $topicInfo.find('strong a').eq(0).text().trim(),
          avatar: $topicItem.find('td:first-child').find('a > img').attr('src'),
        },
        votes: parseInt($topicItem.find('.votes').text().trim(), 10),
        last_reply_by: $topicInfo
          .find('strong:nth-of-type(2) a')
          .attr('href')
          ?.replace('/member/', '')
          .trim(),
      } as Topic
    })
    .get()
    .filter(Boolean)
}

export function parseTopic($: CheerioAPI): Omit<Topic, 'id'> {
  return {
    ...invoke(() => {
      let views = 0
      let likes = 0
      let thanks = 0

      $('.topic_stats')
        .text()
        .split('∙')
        .forEach((value, _) => {
          if (value.includes('点击')) {
            views = parseInt(value, 10)
          } else if (value.includes('收藏')) {
            likes = parseInt(value, 10)
          } else if (value.includes('感谢')) {
            thanks = parseInt(value, 10)
          }
        })

      return {
        views,
        likes,
        thanks,
      }
    }),
    ...invoke(() => {
      const $topicButtons = $('.topic_buttons').find('.tb')
      const url = $topicButtons.eq(0).attr('href')
      if (!url) return

      return {
        once: getURLSearchParams(url).once,
        liked: url.includes('unfavorite'),
        ignored: $topicButtons.eq(2).attr('href')?.includes('unignore'),
      }
    }),
    ...invoke(() => {
      const opHrefs = $('.header .op')
        .map((_i, op) => $(op).attr('href'))
        .get()
        .filter(isString)

      return {
        editable: opHrefs.some(href => href.includes('/edit/topic')),
        appendable: opHrefs.some(href => href.includes('/append/topic')),
      }
    }),
    title: $('h1').eq(0).text(),
    created: parseTimestamp($('small.gray > span').attr('title')!),
    content: $('.topic_content').html()!,
    via: parseVia($('small.gray').text().split('·')[1]),
    thanked: !!$('.topic_thanked').length,
    votes: parseInt($($('.votes').find('a').get(0)).text() || '0', 10),
    supplements: $('.subtle')
      .map((i, subtle) => ({
        created: parseTimestamp($(subtle).find('.fade>span').attr('title')!),
        content: $(subtle).find('.topic_content').html()!,
      }))
      .get(),
    node: parseNodeByATag($('.header > a:nth-child(4)')),
    member: invoke(() => {
      const $avatar = $('.header').find('.avatar')
      return {
        username: $avatar.attr('alt')!,
        avatar: $avatar.attr('src')!,
      }
    }),
    reply_count: defaultTo(
      parseInt(
        $('#Main .box .cell .gray').eq(0).text().split('•')[0].trim(),
        10
      ),
      0
    ),
    replies: $('.cell')
      .map((i, reply) => {
        const $reply = $(reply)
        const id = Number($reply.attr('id')?.replace('r_', '').trim())
        if (!id) return
        const $avatar = $reply.find('.avatar')
        const content = $reply.find('.reply_content').html()!

        return {
          member: {
            username: $avatar.attr('alt')!,
            avatar: $avatar.attr('src')!,
          },
          id,
          no: +$reply.find('.no').text(),
          created: parseTimestamp($reply.find('.ago').attr('title')!),
          via: parseVia($reply.find('.ago').text()),
          content,
          thanks: parseInt($reply.find('.small.fade').text() || '0', 10),
          thanked: !!$reply.find('.thanked').length,
          op: !!$reply.find('.badge.op').length,
          mod: !!$reply.find('.badge.mod').length,
          has_related_replies: !!RegExp('<a href="/member/(.*?)">').exec(
            content
          ),
        } as Reply
      })
      .get()
      .filter(Boolean),
  }
}

export function parseMember($: CheerioAPI): Omit<Member, 'username'> {
  const $profile = $('#Main .box').first()
  const $info = $profile.find('.gray').eq(0)
  const infoText = $info.text()
  const $buttons = $profile.find('.fr').eq(0).find('input')

  return {
    id: defaultTo(Number(infoText.match(/V2EX\s第\s(\d+)/)?.[1]), undefined),
    avatar: $profile.find('img').eq(0).attr('src'),
    created: infoText.match(/加入于\s(.+\+08:00)/)?.[1],
    activity: defaultTo(+$profile.find('.gray a').eq(0).text(), undefined),
    online: !!$('.online').length,
    motto: $('.bigger').text() || undefined,
    widgets: $('.widgets a')
      .map((i, a) => {
        const $a = $(a)

        return {
          uri: $a.find('img').attr('src')!,
          title: $a.text().trim()!,
          link: $a.attr('href')!,
        }
      })
      .get(),
    ...invoke(() => {
      const $postInfo = $(`#Main .box span:contains('🏢')`).eq(0)
      if (!$postInfo.length) return {}

      return {
        company: $postInfo.find('strong').text().trim() || undefined,
        title: $postInfo.text().split('/')[1]?.trim() || undefined,
      }
    }),
    overview: $profile.find('.cell').eq(1).html() || undefined,
    blocked: $buttons.eq(1).attr('value')?.trim().toLowerCase() === 'unblock',
    followed: $buttons.eq(0).attr('value')?.includes('取消'),
    once: $buttons
      .eq(0)
      .attr('onclick')
      ?.match(/once=(\d+)/)?.[1],
    ...parseBalance($profile, '.balance_area'),
  }
}

export function parseMemberReplies(
  $: CheerioAPI
): (Omit<Topic, 'replies'> & { reply: Reply })[] {
  return $('#Main .box .dock_area')
    .map((i, reply) => {
      const $reply = $(reply)
      const $dock = $reply.find('table tbody tr td').eq(0)

      return {
        member: {
          username: $dock.find('.gray a').eq(0).text().trim()!,
        },
        node: parseNodeByATag($dock.find('.gray a').eq(1)),
        ...parseTopicByATag($dock.find('.gray a').eq(2)),
        reply: {
          created: $dock.find('.fr').text().trim()!,
          content: $reply.next().find('.reply_content').html()!,
        },
      } as Omit<Topic, 'replies'> & { reply: Reply }
    })
    .get()
}

export function parseProfile($: CheerioAPI): Profile {
  const $profile = $('#Rightbar .box .cell')

  return {
    username: $profile
      .find('a')
      .eq(0)
      .attr('href')
      ?.replace('/member/', '')
      .trim()!,
    motto: $profile
      .find('table:nth-child(1) > tbody > tr > td:nth-child(3) > span.fade')
      .text(),
    avatar: $profile.find('img').eq(0).attr('src')!,
    my_notification: defaultTo(
      parseInt($('#money').prev().text().trim(), 10),
      0
    ),
    once: $('.site-nav .tools a')
      .last()
      .attr('onclick')
      ?.match(/once=(\d+)/)?.[1],
    ...invoke(() => {
      const $tds = $profile.eq(0).find('table').eq(1).find('td')

      return {
        my_nodes: defaultTo(+$tds.eq(0).find('.bigger').text().trim(), 0),
        my_topics: defaultTo(+$tds.eq(1).find('.bigger').text().trim(), 0),
        my_following: defaultTo(+$tds.eq(2).find('.bigger').text().trim(), 0),
      }
    }),
    ...parseBalance($profile, '.balance_area'),
  }
}

export function parseNavAtoms($: CheerioAPI) {
  return $(`#Main .box`)
    .eq(1)
    .children('div:not(:first-child)')
    .map((i, item) => {
      const $td = $(item).find('td')
      return {
        title: $td.eq(0).text(),
        nodeNames: $td
          .eq(1)
          .find('a')
          .map((j, a) => $(a).attr('href')?.replace('/go/', '').trim()!)
          .get()
          .filter(Boolean),
      }
    })
    .get()
}

export function parseRecentTopics($: CheerioAPI) {
  return $(`#my-recent-topics .cell:not(:first-child)`)
    .map((i, item) => {
      const $item = $(item)
      const $topic = $item.find('a').eq(1)

      return {
        member: invoke(() => {
          const $avatar = $item.find('a:first-child img').eq(0)
          return {
            username: $avatar.attr('alt')!,
            avatar: $avatar.attr('src')!,
          }
        }),
        id: $topic.attr('href')!.match(/\d+/g)!.map(Number)[0],
        title: $topic.text(),
      } as RecentTopic
    })
    .get()
}

export function parseRank($: CheerioAPI) {
  return $(`#Main > div.box > div.inner > table tr`)
    .map((i, item) => {
      const $item = $(item)
      const $avatar = $item.find('a:first-child img').eq(0)
      const $secondTd = $item.find('td:nth-child(2)')

      return {
        username: $avatar.attr('alt')!,
        avatar: $avatar.attr('src')!,
        motto: !$secondTd.find('.f12').eq(0).find('a').length
          ? $secondTd.find('.f12').eq(0).text()
          : undefined,
        website: $secondTd.find('.gray a').attr('href'),
        id: defaultTo(
          +$secondTd.find('.fade')?.text()?.match(/\d+/)?.[0]!,
          undefined
        ),
        cost: $item.find('.balance_area').text().trim(),
        ...parseBalance($item, '.balance_area'),
      } as Member
    })
    .get()
    .filter(item => !!item.username)
}
