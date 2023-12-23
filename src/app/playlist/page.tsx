"use client";

import Icon from "@/components/Icon";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Player } from "@/components/Player";
import useNoSleep from "@/hooks/useNoSleep";
import { Song, Playlist } from "@/interfaces";
import { songAtom, playlistAtom } from "@/state";
import {
  getYouTubeId,
  isYoutubeURL,
  getYouTubePlaylistId,
  isYoutubePlaylistURL,
} from "@/utils";
import {
  Button,
  Center,
  Container,
  Flex,
  Image,
  Text,
  rem,
} from "@mantine/core";
import { useShallowEffect } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconMusic } from "@tabler/icons-react";
import { atom, useAtom } from "jotai";
import localforage from "localforage";
import { useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";

const loadingAtom = atom(false);

export default function PlaylistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useAtom(loadingAtom);
  const [playlist, setPlaylist] = useAtom(playlistAtom);
  const [isPlayer, setIsPlayer] = useState(false);
  const [noSleepEnabled, setNoSleepEnabled] = useNoSleep();
  const posthog = usePostHog();

  useShallowEffect(() => {
    posthog.capture("playlist_page");
    const playlistId = searchParams.get("list");
    if (!playlistId) {
      notifications.show({
        title: "Error",
        message: "Invalid YouTube Playlist ID",
      });
      router.push("/");
      return;
    }

    // check if it's a youtube playlist url
    const url = "https://youtube.com/playlist?list=" + playlistId;
    if (!isYoutubePlaylistURL(url)) {
      notifications.show({
        title: "Error",
        message: "Invalid YouTube Playlist URL",
      });
      router.push("/");
      return;
    }

    setLoading(true);

    getPlaylistFromYouTube(url)
      .then((playlist) => {
        setPlaylist(playlist.songs);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Download error",
          message: e.message,
        });
        setLoading(false);
        router.push("/");
      });
  }, []);

  return (
    <>
      <LoadingOverlay
        visible={loading}
        message="Downloading playlist, please wait..."
      />
      {playlist && !isPlayer && !loading && (
        <Container size="xs">
          <Flex
            h="100dvh"
            align="stretch"
            justify="center"
            gap="md"
            direction="column"
          >
            <Flex gap={6} align="center" mb="sm">
              <Icon size={18} />
              <Text
                fz={rem(20)}
                fw="bold"
                lts={rem(0.2)}
                style={{
                  userSelect: "none",
                }}
              >
                Playlist Details
              </Text>
            </Flex>
            <Text weight={600} color="dimmed">
              Playlist Details
            </Text>
            {/* Playlist details and songs will be rendered here */}
            {/* <Carousel
              withIndicators
              height={200}
              slideSize="33.333333%"
              slideGap="md"
              loop
              align="start"
              slidesToScroll={3}
            >
              {playlist.slice(-6).map((song: Song) => (
                <Carousel.Slide key={song.metadata.id}>1</Carousel.Slide>
              ))}
            </Carousel> */}

            <Button
              onClick={() => {
                setIsPlayer(true);

                if (!noSleepEnabled) {
                  setNoSleepEnabled(true);
                }
              }}
            >
              Go to Player
            </Button>
          </Flex>
        </Container>
      )}
      {/* {isPlayer && <Player playlist={playlist} />} */}
    </>
  );
}

async function getPlaylistFromYouTube(url: string): Promise<Playlist> {
  if (!isYoutubePlaylistURL(url) && !getYouTubePlaylistId(url)) {
    throw new Error("Invalid YouTube Playlist URL");
  }

  // check cached playlist
  const id = getYouTubePlaylistId(url);
  const cachedPlaylist = (await localforage.getItem(id)) as any;

  //   if (cachedPlaylist) {
  //     return cachedPlaylist;
  //   }

  return fetch("/api/ytplaylist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json();
      if (body.message) {
        throw new Error(body.message);
      }
      throw new Error(`Error downloading YouTube playlist (${res.statusText})`);
    }

    const playlist = await res.json();

    // save the playlist to the cache localForage
    localforage.setItem(id, playlist);

    return playlist;
  });
}
