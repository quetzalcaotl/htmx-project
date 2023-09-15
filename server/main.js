const paths = {
  "/": serveHomepage,
  "/static": serveStatic,
  "/posts": getPostListHtml,
  "/like": toggleLike,
  "/favorite": toggleFavorite,
  "/reply": reply
};

Bun.serve({
  development: true,
  port: 8080,
  hostname: "localhost",
  fetch(req) {
    console.log("Processing request");
    const url = new URL(req.url);
    const path = url.pathname;
    const firstPath = url.pathname.split("/")[1] || "";
    console.log(path);

    if (firstPath.length) return paths[`/${firstPath}`](req, path);
    if (Object.hasOwn(paths, path)) return paths[path](req);
    return new Response(null,{ status: 404 });
  }
});

function serveHomepage() {
  console.log("Serving homepage");
  return new Response(Bun.file(__dirname + "/templates/home.html"));
}
function serveStatic(req, path) {
  console.log(`Serving ${path}`);
  return new Response(Bun.file(__dirname + path));
}
async function getPostListHtml(req, path) {
  const postid = path.split("/")[2] || "";

  if (postid) return new Response(await getPost(postid));
  const posts = await getAllPosts(postid);
  const postListHtml = [];
  for (const postid in posts) {
    const post = await getPost(postid);
    const postHtml = await createPostHtml(post);
    postListHtml.push(postHtml);
  }
  return new Response(postListHtml.join(""));
}
async function getAllPosts() {
  return JSON.parse(await Bun.file(__dirname + "/data/posts.json").text());
}
async function getPost(postid) {
  const posts = JSON.parse(await Bun.file(__dirname + "/data/posts.json").text());
  return posts[postid];
}
async function getLikecount(postid) {
  const posts = JSON.parse(await Bun.file(__dirname + "/data/posts.json").text());
  return posts[postid].likecount;
}
async function getFavoritecount(postid) {
  const posts = JSON.parse(await Bun.file(__dirname + "/data/posts.json").text());
  return posts[postid].favoritecount;
}
async function getReplycount(postid) {
  const posts = JSON.parse(await Bun.file(__dirname + "/data/posts.json").text());
  return posts[postid].replycount;
}
async function getUser(userid) {
  const users = JSON.parse(await Bun.file(__dirname + "/data/users.json").text());
  return users[userid];
}
async function createPostHtml(post) {
  const user = await getUser(post.userid);
  
  let postHtml = await Bun.file(__dirname + "/partials/post.html").text();
  postHtml = postHtml.replaceAll("{postid}", post.postid);
  postHtml = postHtml.replace("{username}", user.username);
  postHtml = postHtml.replace("{userhandle}", user.userhandle);
  postHtml = postHtml.replace("{profilepicture}", user.profilepicture);
  postHtml = postHtml.replace("{postdate}", generateDateDiff(post.postdate));
  postHtml = postHtml.replace("{text}", post.text);
  postHtml = postHtml.replace("{likecount}", post.likecount);
  postHtml = postHtml.replace("{favoritecount}", post.favoritecount);
  postHtml = postHtml.replace("{replycount}", post.replycount);
  
  return postHtml;
}
async function toggleLike(req, path) {
  const postid = path.split("/")[2] || "";
  const posts = await getAllPosts();
  const post = await getPost(postid);

  if (post.likes[post.userid]) {
    delete post.likes[post.userid];
    post.likecount--;    
  } else {
    post.likes[post.userid] = true;
    post.likecount++;
  }
  const updatedPost = JSON.stringify(Object.assign(posts, { [postid]: post }),null,2);
  await Bun.write("./data/posts.json", updatedPost);
  return new Response(await getLikecount(postid));
}
async function toggleFavorite(req, path) {
  const postid = path.split("/")[2] || "";
  const posts = await getAllPosts();
  const post = await getPost(postid);

  if (post.favorites[post.userid]) {
    delete post.favorites[post.userid];
    post.favoritecount--;    
  } else {
    post.favorites[post.userid] = true;
    post.favoritecount++;
  }

  const updatedPost = JSON.stringify(Object.assign(posts, { [postid]: post }),null,2);
  await Bun.write("./data/posts.json", updatedPost);
  return new Response(await getFavoritecount(postid));
}
async function reply(req, path) {
  // TODO
}

function generateDateDiff(datetime) {
  const datediff = Date.now() - datetime;
  
  if (datediff < 60_000) return "less than a minute ago";
  if (datediff < 120_000) return "a minute ago"; // less than 2 minutes
  if (datediff < 3_600_000) return `${Math.floor(datediff / 60_000)} minutes ago`;
  if (datediff < 7_200_000) return "an hour ago"; // less than 2 hours
  if (datediff < 86_400_000) return `${Math.floor(datediff / 3_600_000)} hours ago`;
  if (datediff < 172_800_000) return "one day ago"; // less than 2 days
  if (datediff < 2_592_000_000) return `${Math.floor(datediff / 86_400_000)} days ago`;
  return "shit's old, yo";
  if (datediff < x) return "one month ago"; // less than 2 months
  if (datediff < y) return `${Math.floor(datediff / x)} months ago`;
  if (datediff < z) return "one year ago"; // less than 2 years
  if (datediff < a) return `${Math.floor(datediff / z)} years ago`;
}