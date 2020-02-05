let classes = "scout soldier demoman medic".split(" ");
let id = i => document.getElementById(i);

let hl = el => {
  el.classList.toggle("font-black");
};

let cycleClass = el => {
  let cl = el.classList;

  let id = cl.contains("class-scout")
    ? 0
    : cl.contains("class-soldier")
    ? 1
    : cl.contains("class-demoman")
    ? 2
    : -1;

  el.classList.remove("class-scout", "class-soldier", "class-demoman");
  el.classList.add(`class-${classes[id + 1]}`);
};

let loadUrl = async () => {
  let el = id("match-url");
  let match = el.value.match(/(\d+)(?:#.+)?/);

  if (match === null) {
    alert("Invalid input");
    return;
  }

  let r = await fetch(`http://logs.tf/json/${match[1]}`);

  if (r.status !== 200) {
    alert("Match not found");
    return;
  }

  let data = await r.json();

  let head = `
    <tr class="leading-loose text-right text-lg text-gray-600">
      <th></th>
      <th></th>
      <th class="px-4 font-semibold">DA</th>
      <th class="px-4 font-semibold">K</th>
      <th class="px-4 font-semibold">A</th>
      <th class="px-4 font-semibold">D</th>
      <th class="px-4 font-semibold">K/D</th>
      <th class="px-4 font-semibold">DA/M</th>
      <th class="px-4 font-semibold">DT/M</th>
      <th class="px-4 font-semibold">HR/M</th>
    </tr>
  `;

  let minutes = data.info.total_length / 60;

  let players = Object.entries(data.players)
    .sort(([id1, p1], [id2, p2]) =>
      [p1.team, classes.indexOf(p1.class_stats[0].type), p2.kills] <
      [p2.team, classes.indexOf(p2.class_stats[0].type), p1.kills]
        ? -1
        : 1
    )
    .map(([id, p]) => ({
      name: data.names[id],
      class: p.class_stats[0].type,
      dtpm: (p.dt / minutes).toFixed(0),
      hrpm: (p.hr / minutes).toFixed(0),
      ...p
    }))
    .map(
      p => `
        <tr class="text-2xl leading-loose text-right bg-gray-300">
          <td class="px-4 font-bold text-left" contenteditable>${p.name}</td>
          <td class="class-${p.class} bg-center" style="width: 52px" onclick="cycleClass(this)"></td>
          <td class="px-4" onclick="hl(this)">${p.dmg}</td>
          <td class="px-4" onclick="hl(this)">${p.kills}</td>
          <td class="px-4" onclick="hl(this)">${p.assists}</td>
          <td class="px-4" onclick="hl(this)">${p.deaths}</td>
          <td class="px-4" onclick="hl(this)">${p.kpd}</td>
          <td class="px-4" onclick="hl(this)">${p.dapm}</td>
          <td class="px-4" onclick="hl(this)">${p.dtpm}</td>
          <td class="px-4" onclick="hl(this)">${p.hrpm}</td>
        </tr>
      `
    )
    .join("");

  var stats = id("stats");
  stats.innerHTML = players;
  stats.children[0].children[5].insertAdjacentHTML("afterEnd", head);
};

id("load-match").addEventListener("submit", loadUrl);

id("reorder-players").addEventListener("click", () => {
  let stats = id("stats");
  let list = Array.from(stats.children[0].children);

  let i = cl =>
    cl.contains("class-scout")
      ? 0
      : cl.contains("class-soldier")
      ? 1
      : cl.contains("class-demoman")
      ? 2
      : 3;

  let f = (a, b) =>
    [i(a.children[1].classList), parseInt(b.children[2].innerText)] <
    [i(b.children[1].classList), parseInt(a.children[2].innerText)]
      ? -1
      : 1;

  let team1 = list.slice(0, 6).sort(f);
  let team2 = list.slice(7, 13).sort(f);
  let newChildren = [...team1, list[6], ...team2];
  let parent = stats.children[0];
  newChildren.forEach(c => parent.appendChild(c));
});

id("swap-teams").addEventListener("click", () => {
  let p = id("stats").children[0];
  for (i = 0; i < 6; i++) {
    p.insertBefore(p.children[12], p.children[0]);
  }
  p.insertBefore(p.children[12], p.children[6]);
});

id("download").addEventListener("click", () => {
  html2canvas(id("render")).then(c => {
    let link = document.createElement("a");
    link.download = "ascent-logs.png";
    link.href = c.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

id("upload-background").addEventListener("change", e => {
  let reader = new FileReader();
  reader.readAsDataURL(e.target.files[0]);
  reader.onload = () => {
    id("render").style.backgroundImage = `url('${reader.result}')`;
  };
});

id("upload-blu-logo").addEventListener("change", e => {
  let reader = new FileReader();
  reader.readAsDataURL(e.target.files[0]);
  reader.onload = () => {
    id("blu-logo").src = reader.result;
  };
});

id("upload-red-logo").addEventListener("change", e => {
  let reader = new FileReader();
  reader.readAsDataURL(e.target.files[0]);
  reader.onload = () => {
    id("red-logo").src = reader.result;
  };
});
