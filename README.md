# Sample Kubernetes Project

This is a sample Kubernetes Project. The purpose of this project is to learn CodeZero and how various features help you greatly accelerate and enhance your Kubernetes development experience

This project may not contain all possible Kubernetes scenarios and may not illustrate all CodeZero features. If there is anything not covered in these samples, please feel free to submit a pull request and reach out to us on our [discussion forums](https://github.com/c6o/roadmap/discussions). We welcome new feature requests!

While the project is written in NodeJS, CodeZero and Kubernetes are language agnostic. We chose JavaScript given its familiarity among a wide range of developers.

## Architecture

The project comprises of the following services and their equivalent deployments:

* Frontend
* Core
* Edge
* Database
* Sockets

The following diagram assumes this project is deployed to the `sample-project` namespace and uses Traefik for ingress.

![Diagram](http://www.plantuml.com/plantuml/svg/bPJ1JXin48RFyLEON1gaXbLxx0a8LAfAAMABUgc49lPauyPhh-mnb5QyUssSn1j09DdBnZF_Pyy_uysn9t0KMiqzj9t6SUViRnJ43cYEBNA1BcW4CxQ1j3B8_4AP3XoqF2tfeKDk7SqjOnfdnCbofvevSQaS2bBMCFQEd_mD3jc1n5baykegdJadwlodgd9mVzGeceTfyEY4DOI6ZeHjgsibm4bxgR13NJsHuoiDXcw-NLGEDOB7wkFuGoMLZqKh8tIG69mkfsHgOjlMcgCk1jwIrIfsGSqKohUabqZtriLED9cwi21F8PObq6KkcluQfkWC4lgrynBQqRuKu85KjLY3nNqBdj1bu_qwdvtIOsydQUi_LAnjHvutv2tiUrrN9NJIgOpiJDHtOa_YYsds9Awit9CumqxRXwLx46GT7zvuT4CEdgU1RGwRnvlMMOE6F9lea6PqUsg3aU0UHY87tlDX7yZ1uI7_nnYFpoMqw3iGM43ZJq4ipesCwEQN-eGDs2216uqPaGESgKKauigXzyFuStZ8s62mqVEHlnEVdJKKqxFqHYENKhvyNkWdrc6KYFZQ9ZsNJPAYRBPApwPH885W2dwhkBOYDSEA1TBQsgQwZ6yaiTlPOq5siLdKnUakwjVCzYTJb9jEoywFx96n5tz08z1fvnJwPLR19NMDkZVjNazuIMRFnNmlbGqMfxrKShCoLS9vI6iBAP4ovMgMOjPKgQhSi-lp-iThwRpjpxhaCf1hBUIBx5EThJMDNPQKkxQggrGJVFfSOt9L_Z4Q6Lhz7m00)

## Getting Started

The goal of this project is to show you local development against an application running in a Kubernetes cluster. You will need to clone this repo and set up a Kubernetes cluster.

Getting to know Kubernetes is beyond the scope of this README however, you can check out our beginers articles on our [Blog](https://blog.codezero.io/tag/learning/).

### Local Setup

This project has been tested on MacOS (BigSur), Linux and Windows Subsystem for Linux.

This project requires NodeJS 16 or greater and all services can run locally with minimal requirements. After you clone the project, you can build and run all the services locally with the following steps:

```bash
yarn install
yarn start

# On MacOS
open http://localhost:3000
```

If you're not on a Mac, instead of the open command, you simly need to launch a browser to [http://localhost:3000](http://localhost:3000).

Hit Ctrl-C to exit.

### Kubernetes Setup

For development, we recommend using either [Civo](https://civo.com) or [DigitalOcean](https://digitalocean.com) however, any k8s or k3s Kubernetes cluster will do. This project uses Persistent Volumes and either LoadBalancer services (digitalocean) or Traefik V2 (civo) for Ingress

Once your cluster is set up, you can install the sample project in cluster using:

```bash
kubectl create ns sample-project
kubectl -n sample project apply -f ./k8s
```

This will install all the services and deployment but will not set up ingress.

If you're on k3s, install TraefikV2 and run the following:

```bash
kubectl -n sample project apply -f ./k8s/traefik
```

If you're on k8s and have a LoadBalancer controller, run the following:

```bash
kubectl -n sample project apply -f ./k8s/loadbalance
```

You will then need to obtain the TraefikV2 ingress IP address or the LoadBalancer IP address and go to http://<IP ADDRESS> in a browser.