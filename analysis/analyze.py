import re
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
DATA = HERE / "data"
OUT = HERE / "output"
OUT.mkdir(exist_ok=True)


def load(path):
    df = pd.read_csv(path)
    df["platform"] = re.sub(r"_\d+$", "", path.stem)
    return df


def agreement(df):
    return (df["afinn_judgment"] == df["vader_judgment"]).mean() * 100


def han_agreement(df):
    afinn_han = df["afinn_judgment"].astype(str).str.contains("HAN")
    vader_han = df["vader_judgment"].astype(str).str.contains("HAN")
    both = (afinn_han & vader_han).sum()
    afinn_only = (afinn_han & ~vader_han).sum()
    vader_only = (~afinn_han & vader_han).sum()
    neither = (~afinn_han & ~vader_han).sum()
    return (afinn_han == vader_han).mean() * 100, both, afinn_only, vader_only, neither


CATS = ["HAN", "LAN", "NEU", "LAP", "HAP"]
COLORS = ["red", "blue", "lightgrey", "green", "yellow"]
EMOJI = ["😠", "🙁", "😐", "🙂", "😄"]
EMOJI_FONT = "/System/Library/Fonts/Apple Color Emoji.ttc"  # macOS


def emoji_image(char):
    font = ImageFont.truetype(EMOJI_FONT, 160)
    img = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((0, 0), char, font=font, embedded_color=True)
    return OffsetImage(np.asarray(img), zoom=0.22)


def draw_mix_bar(ax, judgments, title):
    counts = judgments.value_counts()
    total = len(judgments)
    left = 0
    for cat, color, emoji in zip(CATS, COLORS, EMOJI):
        pct = counts.get(cat, 0) / total * 100
        ax.barh(0, pct, left=left, color=color, height=0.6)
        ax.add_artist(AnnotationBbox(emoji_image(emoji), (left + pct / 2, -0.45), frameon=False))
        ax.text(left + pct / 2, -0.8, f"{pct:.0f}%", ha="center", va="top", fontsize=10)
        left += pct
    ax.set_xlim(0, 100)
    ax.set_ylim(-1.1, 0.4)
    ax.set_title(f"{title} (n={total})", fontweight="bold")
    ax.axis("off")


def plot_distribution(df, platform):
    fig, axes = plt.subplots(2, 1, figsize=(6, 3.8))
    draw_mix_bar(axes[0], df["afinn_judgment"], f"Affect Mix Index — AFINN ({platform})")
    draw_mix_bar(axes[1], df["vader_judgment"], f"Affect Mix Index — VADER ({platform})")
    fig.tight_layout()
    fig.savefig(OUT / f"{platform}_distribution.png", dpi=150)
    plt.close(fig)


def print_han(name, df):
    pct, both, afinn_only, vader_only, neither = han_agreement(df)
    print(f"  {name} HAN-or-not agreement: {pct:.1f}%  "
          f"(both HAN {both}, AFINN only {afinn_only}, VADER only {vader_only}, neither {neither})")


frames = []
for path in sorted(DATA.glob("*.csv")):
    df = load(path)
    platform = df["platform"].iloc[0]
    frames.append(df)
    plot_distribution(df, platform)
    print(f"{platform}: {agreement(df):.1f}% category agreement")
    print_han(platform, df)

combined = pd.concat(frames, ignore_index=True)
print(f"All platforms: {agreement(combined):.1f}% category agreement ({len(combined)} posts)")
print_han("All platforms", combined)

disagree = combined[combined["afinn_judgment"] != combined["vader_judgment"]]
disagree.to_csv(OUT / "disagreement.csv", index=False)
print(f"{len(disagree)} disagreements saved to output/disagreement.csv")

han_disagree = combined[
    combined["afinn_judgment"].astype(str).str.contains("HAN")
    != combined["vader_judgment"].astype(str).str.contains("HAN")
]
han_disagree.to_csv(OUT / "filter_disagreement.csv", index=False)
print(f"{len(han_disagree)} HAN-or-not disagreements saved to output/filter_disagreement.csv")

sample = disagree.sample(frac=1, random_state=42).groupby("platform").head(10)
sample.to_csv(OUT / "sample_disagreement.csv", index=False)
print(f"{len(sample)} sampled posts saved to output/sample_disagreement.csv")
