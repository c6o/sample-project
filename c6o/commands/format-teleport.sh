

czctl <action> <k8s-file>

czctl intercept -n namespace -s service --localPort <port> --remotePort <port>
czctl teleport -n namespace

czctl service intercept
czctl namespace teleport

czctl service debug <app> -n namespace --intercept --to-local 8080 --out-file <filename>

czctl [kind] action
czctl