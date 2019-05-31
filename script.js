let classes = "scout soldier demoman medic".split(" ")
let id = (i) => document.getElementById(i)

let highlightStat = (el) => {
    el.classList.toggle("highlight")
}

let cycleClass = (el) => {
    let cl = el.classList
    let id =
        cl.contains('class-scout') ? 0 :
        cl.contains('class-soldier') ? 1 :
        cl.contains('class-demoman') ? 2 : -1

    el.classList = `player-class class-${classes[id + 1]}`
}

let loadUrl = () => {
    let btn = id("load-match")
    let el = id("match-url")
    let match = el.value.match(/https?:\/\/logs\.tf\/(\d+)(?:#.+)?/)
    var logId = 0

    if (match === null) {
        el.style.borderColor = "red"
        btn.innerHTML = "Load a valid URL this time -_-"
        return
    } else {
        el.style.borderColor = null
        btn.innerHTML = "Load"
        logId = match[1]
    }

    fetch(`https://logs.tf/json/${logId}`)
        .then((r) => {
            if (r.status !== 200) {
                el.style.borderColor = "red"
                btn.innerHTML = "Load a log that exists this time -_-"
                return
            }

            r.json().then((data) => {
                let head = `
                    <tr id="stats-header">
                        <th class="player-name"></th>
                        <th class="player-class"></th>
                        <th class="player-stat">DA</th>
                        <th class="player-stat">K</th>
                        <th class="player-stat">A</th>
                        <th class="player-stat">D</th>
                        <th class="player-stat">K/D</th>
                        <!-- <th class="player-stat">K+A/D</th> !-->
                        <th class="player-stat">DA/M</th>
                        <th class="player-stat">DT/M</th>
                        <th class="player-stat">HR/M</th>
                    </tr>
                `
                let players = Object.entries(data.players)
                    .sort(([id1, p1], [id2, p2]) =>
                        [ p1.team
                        , classes.indexOf(p1.class_stats[0].type)
                        , p2.kills
                        ]
                            <
                        [ p2.team
                        , classes.indexOf(p2.class_stats[0].type)
                        , p1.kills
                        ]
                            ? -1 : 1
                    )
                    .map(([id, p]) => `
                        <tr>
                            <td class="player-name" contenteditable>${ data.names[id] }</td>
                            <td class="player-class class-${ p.class_stats[0].type }" onclick="cycleClass(this)"></td>
                            <td class="player-stat" onclick="highlightStat(this)">${ p.dmg }</td>
                            <td class="player-stat" onclick="highlightStat(this)">${ p.kills }</td>
                            <td class="player-stat" onclick="highlightStat(this)">${ p.assists }</td>
                            <td class="player-stat" onclick="highlightStat(this)">${ p.deaths }</td>
                            <td class="player-stat" onclick="highlightStat(this)">${ p.kpd }</td>
                            <!-- <td class="player-stat" onclick="highlightStat(this)">${ p.kapd }</td> !-->
                            <td class="player-stat" onclick="highlightStat(this)">${ p.dapm }</td>
                            <td class="player-stat" onclick="highlightStat(this)">${ (p.dt / (data.info.total_length / 60)).toFixed(0) }</td>
                            <td class="player-stat" onclick="highlightStat(this)">${ (p.hr / (data.info.total_length / 60)).toFixed(0) }</td>
                        </tr>
                    `)
                    .join("")

                var el = id("stats")
                el.innerHTML = players
                el.children[0].children[5].insertAdjacentHTML("afterEnd", head)

                var legend = id("legend")
                legend.innerHTML = [
                    "K = KILLS",
                    "A = ASSISTS",
                    "D = DEATHS",
                    "DA = DAMAGE",
                    "DT = DAMAGE TAKEN",
                    "HR = HEALS RECEIVED",
                    "M = MINUTE"
                ]
                .join(" | ")
            })
        })

}

id("load-match").addEventListener("click", loadUrl)

id("reorder-players").addEventListener("click", () => {
    let stats = id("stats")
    let list = Array.from(stats.children[0].children)

    let i = (cl) =>
        cl == "player-class class-scout" ? 0 :
        cl == "player-class class-soldier" ? 1 :
        cl == "player-class class-demoman" ? 2 : 3
    let f = (a, b) =>
        [ i(a.children[1].classList)
        , parseInt(b.children[2].innerText)
        ]
            <
        [ i(b.children[1].classList)
        , parseInt(a.children[2].innerText)
        ]
            ? -1 : 1

    let team1 = list.slice(0, 6).sort(f)
    let team2 = list.slice(7, 13).sort(f)
    let newChildren = [...team1, list[6], ...team2]
    let parent = stats.children[0]
    newChildren.forEach((c) => parent.appendChild(c))
})

id("swap-teams").addEventListener("click", () => {
    let p = id("stats").children[0]
    for (i = 0; i < 6; i++) {
        p.insertBefore(p.children[12], p.children[0]);
    }
    p.insertBefore(p.children[12], p.children[6]);
})

id("upload-esea").addEventListener("change", (e) => {
    let reader = new FileReader();
    reader.readAsText(e.target.files[0]);
    reader.onload = () => {
        let head = `
            <tr id="stats-header">
                <th class="player-name"></th>
                <th class="player-class"></th>
                <th class="player-stat">DA</th>
                <th class="player-stat">K</th>
                <th class="player-stat">A</th>
                <th class="player-stat">D</th>
                <th class="player-stat">K/D</th>
                <th class="player-stat">DA/M</th>
            </tr>
        `
        // filthy hacks ahead
        let html = reader.result.replace(/\n/g, "").replace(/src="[^"]+"/g, "")

        let table = html.match(/<table class=" Table sc-bdVaJa ksQxxr">.+<\/table>/, html)[0]
        let tmp = document.createElement("div")
        tmp.innerHTML = table
        window.tmp = tmp

        let players = Array.from(tmp.children[0].children[1].children)
            .concat(Array.from(tmp.children[0].children[3].children))
            .map((el) => {
                let c = el.children
                let k = parseInt(c[5].innerText)
                let a = parseInt(c[6].innerText)
                let d = parseInt(c[7].innerText)
                let da = parseInt(c[3].innerText)
                let dapm = parseFloat(c[4].innerText).toFixed(0)
                return `
                    <tr>
                        <td class="player-name" contenteditable>${ c[0].innerText }</td>
                        <td class="player-class" onclick="cycleClass(this)"></td>
                        <td class="player-stat" onclick="highlightStat(this)">${ da }</td>
                        <td class="player-stat" onclick="highlightStat(this)">${ k }</td>
                        <td class="player-stat" onclick="highlightStat(this)">${ a }</td>
                        <td class="player-stat" onclick="highlightStat(this)">${ d }</td>
                        <td class="player-stat" onclick="highlightStat(this)">${ (k/d).toFixed(1) }</td>
                        <td class="player-stat" onclick="highlightStat(this)">${ dapm }</td>
                    </tr>
                `
            })
            .join("")

        var el = id("stats")
        el.innerHTML = players
        el.children[0].children[5].insertAdjacentHTML("afterEnd", head)

        var legend = id("legend")
        legend.innerHTML = [
            "K = KILLS",
            "A = ASSISTS",
            "D = DEATHS",
            "DA = DAMAGE",
            "M = MINUTE"
        ]
        .join(" | ")
    }
})

id("upload-background").addEventListener("change", (e) => {
    let reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
        id("render").style.backgroundImage = `url('${reader.result}')`
    }
})

id("upload-blu-logo").addEventListener("change", (e) => {
    let reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
        id("blu-logo").src = reader.result
    }
})

id("upload-red-logo").addEventListener("change", (e) => {
    let reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
        id("red-logo").src = reader.result
    }
})

id("download").addEventListener("click", () => {
    html2canvas(id("render")).then((c) => {
        let link = document.createElement("a")
        link.download = "ascent-logs.png"
        link.href = c.toDataURL()
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    })
})
