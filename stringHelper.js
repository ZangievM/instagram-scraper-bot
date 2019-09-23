var sliceEntities = (message, entities, type) => {
    let tags = []
    for (const item of entities) {
        if (item.type == type) {
            let tag = message.slice(item.offset, item.offset + item.length)
            tags.push(tag)
        }
    }
    return tags
}
var generateLinks = (usernames) => {
    let mentions = [].concat(usernames)
    let links = []
    for (const mention of mentions) {
        let m = sliceUser(mention)
        if (m.length > 0)
            links.push(`https://www.instagram.com/${m}`)
    }
    return links
}

var getArrowUsernames = (links) => {
    let result = links.map(element => {
        let tmp = element.split('/')
        return `➡️@${tmp[tmp.length-1]}`
    })
    return result
}

var sliceUsers = (text)=>{
    return text.split('➡️@').filter(element=> {
        if(element && element.length>0) return element.trim()
    })
}
var sliceUser = (mention) => {
    let m = mention.split('➡️@')
    if (m.length > 0) return m[1]
    else
        return ""
}
module.exports = {
    sliceEntities,
    generateLinks,
    getArrowUsernames,
    sliceUsers
}