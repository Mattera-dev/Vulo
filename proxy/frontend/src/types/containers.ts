export interface DockerContainerResponse {
  containers: Container[];
}

export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: Port[];
  Labels: Record<string, string>;
  State: ContainerState;
  Status: string;
  HostConfig: HostConfig;
  NetworkSettings: NetworkSettings;
  Mounts: Mount[];
}

// Union type para garantir que você só trate estados reais do Docker
export type ContainerState = 
  | "created" 
  | "restarting" 
  | "running" 
  | "removing" 
  | "paused" 
  | "exited" 
  | "dead";

export interface Port {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: "tcp" | "udp" | "sctp";
}

export interface HostConfig {
  NetworkMode: string;
}

export interface NetworkSettings {
  Networks: Record<string, NetworkEndpoint>;
}

export interface NetworkEndpoint {
  IPAMConfig: IPAMConfig | null;
  Links: string[] | null;
  Aliases: string[] | null;
  MacAddress: string;
  DriverOpts: Record<string, string> | null;
  GwPriority: number;
  NetworkID: string;
  EndpointID: string;
  Gateway: string;
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  DNSNames: string[] | null;
}

export interface IPAMConfig {
  IPv4Address?: string;
  IPv6Address?: string;
  LinkLocalIPs?: string[];
}

export interface Mount {
  Type: "bind" | "volume" | "tmpfs" | "npipe";
  Source: string;
  Destination: string;
  Mode: string;
  RW: boolean;
  Propagation: "repository" | "private" | "rprivate" | "shared" | "rshared" | "slave" | "rslave";
}