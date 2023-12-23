import { isYoutubePlaylistURL, getYouTubePlaylistId } from "@/utils";
import { NextResponse } from "next/server";
import { Playlist } from "@/interfaces";
import ytpl from "ytpl";
import * as ytdl from "ytdl-core";

export async function POST(req: Request) {
  const { url } = await req.json();

  if (!isYoutubePlaylistURL(url)) {
    return NextResponse.json({
      message: "Invalid YouTube Playlist URL",
      status: 400,
    });
  }

  const playlistId = getYouTubePlaylistId(url);
  if (!playlistId) {
    return NextResponse.json({
      message: "Invalid YouTube Playlist ID",
      status: 400,
    });
  }

  try {
    const playlistInfo = await ytpl(playlistId);
    const songsData = playlistInfo.items.map((item) => {
      return {
        fileUrl: "",
        metadata: {
          id: item.id,
          title: item.title,
          author: item.author.name,
          coverUrl: item.bestThumbnail.url,
        },
      };
    });

    const playlist: Playlist = {
      id: playlistInfo.id,
      title: playlistInfo.title,
      songs: songsData,
    };

    return NextResponse.json(playlist);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Error when fetching playlist info",
      },
      { status: 500 }
    );
  }
}
