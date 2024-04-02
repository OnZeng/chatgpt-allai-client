export default async function get_dialog_list(url: string, token: string) {
    const res = await fetch(url + "/api/dialog/getlist", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const d_ = await res.json();
    return d_.data;
  }