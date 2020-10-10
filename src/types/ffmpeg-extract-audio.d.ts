declare module "ffmpeg-extract-audio" {
  import { Readable } from "stream";

  declare const extractAudio: (options: {
    input: string;
    output?: string;
    format?: string;
    channel?: any;
    transform?: Function;
    log?: Function;
  }) => Promise<Readable>;

  export = extractAudio;
}
