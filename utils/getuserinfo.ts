export default async function getuserinfo(url: string, token: string) {
  const res = await fetch(url + "/api/user/getInfo", {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  });
  const d_ = await res.json();
  return d_.data;
}
