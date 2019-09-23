const axios = require('axios')
const database = require('./database')
const lnks = require('./config').links

async function getPostFromLink(link) {
    let result = []
    try {
        let page = await axios.get(link)
        let jsonObject = page.data.match(/<script type="text\/javascript">window\._sharedData = (.*)<\/script>/)[1].slice(0, -1)
        jsonObject = JSON.parse(jsonObject)
        const edges = jsonObject.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges

        for (let i = 0; i < edges.length; i++) {
            let tmp = {
                shortcode: "",
                desc: "",
                user: ""
            }
            const shortcode = edges[i].node.shortcode;
            const innerEdges = edges[i].node.edge_media_to_caption.edges
            let description = ""
            if (innerEdges.length > 0) description = innerEdges[0].node.text
            tmp.shortcode = shortcode
            tmp.desc = description
            tmp.user = jsonObject.entry_data.ProfilePage[0].graphql.user.username
            result.push(tmp)
        }
    } catch (error) {
        console.log('Error in getting posts: ', error)
        return []
    }
    return result
}

var getPosts = async (links = lnks) => {
    let result = []
    let promises = []
    for (const link of links) {
        promises.push(getPostFromLink(link))
    }
    let posts = await Promise.all(promises)
    posts.forEach(elements => {
        elements.forEach(element =>
            result.push(element))
    })
    return result
}

var queryByHashTags = async (hashTags = []) => {
    let posts = await getPosts()
    let result = []
    try {
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            let flag = false
            for (let j = 0; j < hashTags.length; j++) {
                const hashTag = hashTags[j];
                if (post.desc.indexOf(hashTag) != -1) {
                    flag = true
                    break
                }
            }
            if (flag) result.push(post)
        }
    } catch (error) {
        console.log('Error in quering by tags:', error);
        return []
    }

    return result
}
module.exports = {
    links: lnks,
    getPosts,
    queryByHashTags
}