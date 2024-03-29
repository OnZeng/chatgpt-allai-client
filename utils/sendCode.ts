export default async function sendCode(url: string, email: any) {
  const res = await fetch(url + "/api/code/v1?email=" + email, {
    method: "Get",
  });
  return await res.json();
}
