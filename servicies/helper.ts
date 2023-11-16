import { Cheerio, CheerioAPI, Element, load } from 'cheerio'
import { decode } from 'js-base64'
import { defaultTo, unescape } from 'lodash-es'
import { isString } from 'twrnc/dist/esm/types'

import { blackListAtom } from '@/jotai/blackListAtom'
import { RecentTopic } from '@/jotai/recentTopicsAtom'
import { store } from '@/jotai/store'
import { invoke } from '@/utils/invoke'
import { getURLSearchParams } from '@/utils/url'

import { Member, Node, Profile, Reply, Topic } from './types'

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
    name: pasreArgByATag($node, 'go'),
    title: $node.text(),
  }
}

export function parseTopicByATag(
  $topic: Cheerio<Element>
): Pick<Topic, 'id' | 'title' | 'reply_count'> {
  const [_, id, replies] =
    $topic
      .attr('href')
      ?.match(/t\/(\d+).+reply(\d+)/)
      ?.map(Number) || []

  return {
    id,
    title: $topic.text(),
    reply_count: replies || 0,
  }
}

export function pasreArgByATag($a: Cheerio<Element>, path: string) {
  const regex = new RegExp(`${path}\/(.+)`)
  return $a.attr('href')?.match(regex)?.[1]?.trim() ?? ''
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
  const matchedIgnoredTopics = $.text().match(
    /ignored_topics\s=\s\[(.+)\]/
  )?.[1]
  const ignoredTopics = new Set(matchedIgnoredTopics?.split(',').map(Number))
  const matchedBlockers = $.text().match(/blocked\s=\s\[(.+)\]/)?.[1]
  const blockers = new Set(matchedBlockers?.split(',').map(Number))

  if ($.text().match(/ignored_topics\s=/)) {
    store.set(blackListAtom, {
      ignoredTopics: [...ignoredTopics],
      blockers: [...blockers],
    })
  }

  return $(selector)
    .map((i, table) => {
      const $this = $(table)
      const $topicItem = $this.find('table > tbody > tr:first-child')
      const $topicInfo = $topicItem.find('.topic_info')
      const topic = parseTopicByATag($topicItem.find('.item_title a'))

      if (ignoredTopics.has(topic.id)) return
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
              name: $($node)
                .attr('href')
                ?.match(/go\/(.+)/)?.[1]
                ?.trim(),
              title: $node.text(),
            }
            last_touched = $topicInfo.children(':nth-child(4)').text().trim()
          } else {
            last_touched = $topicInfo.children(':nth-child(2)').text().trim()
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
        last_reply_by: pasreArgByATag(
          $topicInfo.find('strong:nth-of-type(2) a'),
          'member'
        ),
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
      const $topicButtons = $('.topic_buttons')
      return {
        once: getURLSearchParams($topicButtons.find('.tb').eq(0).attr('href'))
          .once,
        liked: !!$('.topic_buttons').find('a[href*="unfavorite"]').length,
        ignored: !!$topicButtons.find('a[onclick*="unignore"]').length,
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
    created: $('small.gray > span').text().trim(),
    ...invoke(() => {
      const content = $('.topic_content').html()!
      return {
        content,
        parsed_content: parseBase64Text(content),
      }
    }),
    thanked: !!$('.topic_thanked').length,
    votes: parseInt($($('.votes').find('a').get(0)).text() || '0', 10),
    supplements: $('.subtle')
      .map((i, subtle) => {
        const content = $(subtle).find('.topic_content').html()!
        return {
          created: $(subtle).find('.fade>span').text().trim(),
          content,
          parsed_content: parseBase64Text(content),
        }
      })
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
          created: $reply.find('.ago').text().trim(),
          content,
          parsed_content: invoke(() => {
            const parsedImage = parseImage(content)
            return parsedImage
              ? parseBase64Text(parsedImage) || parsedImage
              : parseBase64Text(content)
          }),
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
      const content = $reply.next().find('.reply_content').html()!
      const { id, ...rest } = parseTopicByATag($dock.find('.gray a').eq(2))

      return {
        member: {
          username: $dock.find('.gray a').eq(0).text().trim()!,
        },
        node: parseNodeByATag($dock.find('.gray a').eq(1)),
        ...rest,
        id: `${id}_${content}`,
        reply: {
          created: $dock.find('.fr').text().trim()!,
          content,
        },
      } as unknown as Omit<Topic, 'replies'> & { reply: Reply }
    })
    .get()
}

export function parseProfile($: CheerioAPI): Profile {
  const $profile = $('#Rightbar .box .cell')

  return {
    username: pasreArgByATag($profile.find('a').eq(0), 'member'),
    motto: $profile
      .find('table:nth-child(1) > tbody > tr > td:nth-child(3) > span.fade')
      .text(),
    avatar: $profile.find('img').eq(0).attr('src')!,
    my_notification: defaultTo(
      parseInt($('#Rightbar a[href$="notifications"]:first').text().trim(), 10),
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
          .map((j, a) => pasreArgByATag($(a), 'go'))
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
        id: $topic.attr('href')?.match(/\d+/g)?.map(Number)[0],
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

export function parseImage(str: string) {
  if (!str) return str

  type Replacer = Parameters<(typeof String)['prototype']['replace']>[1]

  const regex_common_imgurl = /\/.+\.(jpeg|jpg|gif|png|svg)$/
  function is_common_img_url(url: string) {
    // 常见的图片URL
    return url.match(regex_common_imgurl) != null
  }

  const regex_imgur_imgurl = /^https?:\/\/imgur\.com\/[a-zA-Z0-9]{7}$/
  function is_imgur_url(url: string) {
    // 是否属于imgur的图片URL
    return url.match(regex_imgur_imgurl) != null
  }

  function is_img_url(url: string) {
    return is_common_img_url(url) || is_imgur_url(url)
  }

  function convert_img_url(url: string) {
    url = url.replace(/ /g, '')
    // https://imgur.com/s9vHWcC
    if (is_imgur_url(url)) {
      url += '.png'
    }
    if (is_img_url(url)) {
      // not starts with `http`
      if (
        !(
          url.startsWith('//') ||
          url.startsWith('http://') ||
          url.startsWith('https://')
        )
      ) {
        url = 'https://' + url
      }
    }
    return url
  }

  const regex_mdimg = /(?:!\[(.*?)\]\s*\((.*?)\))/g
  const replacer_mdimg2htmlimg: Replacer = (
    match,
    p1,
    p2,
    _offset,
    _string
  ) => {
    p2 = convert_img_url(p2)
    if (is_common_img_url(p2)) {
      show_parsed = true
      let t = `<a target="_blank" href="${p2}"><img src="${p2}" alt="${p1}" /></a>`
      return t
    }
    return match
  }

  const regex_html_imgtag = /&lt;img.*?src="(.*?)"[^\>]*&gt;/g
  const replacer_plainimgtag2imgtag: Replacer = (
    match,
    p,
    _offset,
    _string
  ) => {
    p = convert_img_url(p)
    return `<a target="_blank" href="${p}"><img src="${p}" /></a>`
  }

  const regex_dirty_html = /<(?:\/|)script>/g
  const replace_dirty2escape: Replacer = (p, _offset, _string) => {
    return p.startsWith('<s') ? '&lt;script&gt;' : '&lt;/script&gt;'
  }

  const regex_url =
    /((http(s)?:)?\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  const replacer_url2img: Replacer = (match, _offset, _string) => {
    if (is_common_img_url(match)) {
      let t = `<a target="_blank" href="${match}"><img src="${match}" /></a>`
      return t
    }
    return match
  }

  let show_parsed = false

  let $ = load(str),
    j = 0

  // 1. 恢复出原始文本

  let imgs = $('img'),
    n_imgs = imgs.length
  for (j = 0; j < n_imgs; j++) {
    // 1.1 用<img>中的src替换<img>
    let img = $(imgs[j]),
      img_url = img.attr('src')
    img.replaceWith(img_url || '')
  }

  let links = $(`a`),
    n_links = links.length
  for (j = 0; j < n_links; j++) {
    // 1.2 用<a>中的text替换<a>
    let a = $(links[j]),
      href = a.attr('href'),
      text = a.text()
    text = text.replace(/ /g, '')
    if (is_img_url(href || '') && is_img_url(text)) {
      // or less strict: has_img_url(text)
      a.replaceWith(convert_img_url(text))
    }
  }

  // 2. 重新解析文本
  let html = $.html()
  html = html.replace(regex_mdimg, replacer_mdimg2htmlimg) // 2.1 转换markdown格式的图片![]()

  $ = load(html)

  html = html.replace(regex_html_imgtag, replacer_plainimgtag2imgtag) // 2.2 转换html <img>格式的图片<img />

  $ = load(html)

  let contents = $(`body`).eq(0).contents()

  for (j = 0; j < contents.length; j++) {
    // 2.3 转换plain image url
    const content = $(contents[j])
    if (content[0].nodeType === 3) {
      // text
      let text = $(content).text()
      if (regex_url.test(text)) {
        text = text.replace(regex_url, replacer_url2img)
        $(contents[j]).replaceWith(text)
      }
    }
  }

  //3.替换脏字符为转义字符
  html = $.html()
  html = html.replace(regex_dirty_html, replace_dirty2escape) // 3.1 将脏字符替换为转义字符

  return show_parsed || load(str)('img').length < $('img').length
    ? html
    : undefined
}

export const BASE64_PREFIX = 'base64:'

function parseBase64Text(str?: string) {
  if (!str) return str
  const blacklist = [
    'bilibili',
    'Bilibili',
    'MyTomato',
    'InDesign',
    'Encrypto',
    'encrypto',
    'Window10',
    'USERNAME',
    'airpords',
    'Windows7',
    'Windows11',
  ]
  const $ = load(str)
  const linkTexts = $('a')
    .map((i, o) => $(o).toString())
    .get()
  const rawText = $.html()
  const specialCharReg =
    /[^\u4e00-\u9fa5!-~\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/
  const parsedText = rawText.replace(/[A-z0-9+/=]+/g, text => {
    if (text.length % 4 !== 0 || text.length < 8) return text
    if (linkTexts.some(o => o.includes(text))) return text
    if (blacklist.includes(text)) return text

    try {
      const decodedText = unescape(
        decode(text)
          .replace(/\r?\n?/g, '')
          .trim()
      )
      return specialCharReg.test(decodedText)
        ? text
        : `${text}<a href="${BASE64_PREFIX}${decodedText}">(${decodedText})</a>`
    } catch (error) {
      return text
    }
  })

  return rawText !== parsedText ? parsedText : undefined
}
