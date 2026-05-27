import type { CliQuest } from '../types/cliLab';

export const CLI_QUESTS: Record<string, CliQuest> = {
  'linux-101': {
    id: 'linux-101',
    title: 'Linux Navigation 101',
    description: 'Learn the absolute basics of moving around a Linux file system. Perfect for complete beginners.',
    category: 'Bash',
    difficulty: 'Beginner',
    steps: [
      {
        id: 'pwd',
        objective: 'Print your current working directory to see where you are.',
        expectedCommand: /^pwd$/i,
        hint: 'Use the `pwd` command (Print Working Directory).',
        successMessage: '/home/azureuser\nGreat! You are in your home directory.',
      },
      {
        id: 'ls',
        objective: 'List the contents of your current directory.',
        expectedCommand: /^ls(\s+-l|\s+-a)*$/i,
        hint: 'Use the `ls` command.',
        successMessage: 'clouddrive  script.sh\nAwesome. The `ls` command is used to view files and folders.',
      },
      {
        id: 'mkdir',
        objective: 'Create a new directory named "lab-files".',
        expectedCommand: /^mkdir\s+lab-files$/i,
        hint: 'Use `mkdir <name>` to make a directory.',
        successMessage: 'Directory "lab-files" created.',
      },
      {
        id: 'cd',
        objective: 'Change your directory into the newly created "lab-files".',
        expectedCommand: /^cd\s+lab-files$/i,
        hint: 'Use `cd <directory>` to change directories.',
        successMessage: 'You are now in /home/azureuser/lab-files.\nQuest Complete!',
      }
    ]
  },
  'azcli-101': {
    id: 'azcli-101',
    title: 'Azure CLI: Resource Management',
    description: 'Learn how to create and manage Resource Groups and Virtual Networks using the Azure CLI.',
    category: 'AzureCLI',
    difficulty: 'Beginner',
    steps: [
      {
        id: 'az-group-create',
        objective: 'Create a Resource Group named "CLI-Lab-RG" in the "eastus" location.',
        expectedCommand: /^az\s+group\s+create\s+(.*(--name|-n)\s+CLI-Lab-RG.*)(.*(--location|-l)\s+eastus.*)$/i,
        hint: 'az group create --name CLI-Lab-RG --location eastus',
        successMessage: 'Resource Group "CLI-Lab-RG" provisioned successfully in East US.',
      },
      {
        id: 'az-group-list',
        objective: 'List all your resource groups to verify it was created. Output as a table.',
        expectedCommand: /^az\s+group\s+list.*(--output|-o)\s+table.*$/i,
        hint: 'az group list -o table',
        successMessage: 'Name        Location    Status\n----------  ----------  ---------\nCLI-Lab-RG  eastus      Succeeded',
      },
      {
        id: 'az-vnet-create',
        objective: 'Create a Virtual Network named "Lab-VNet" in "CLI-Lab-RG" with the prefix 10.0.0.0/16.',
        expectedCommand: /^az\s+network\s+vnet\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--name|-n)\s+Lab-VNet.*(--address-prefixes?)\s+10\.0\.0\.0\/16.*$/i,
        hint: 'az network vnet create -g CLI-Lab-RG -n Lab-VNet --address-prefix 10.0.0.0/16',
        successMessage: 'Virtual Network "Lab-VNet" provisioned successfully.',
      }
    ]
  },
  'terraform-101': {
    id: 'terraform-101',
    title: 'Infrastructure as Code: Terraform',
    description: 'Master the core Terraform workflow: init, plan, and apply.',
    category: 'Terraform',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'tf-init',
        objective: 'Initialize the working directory containing your Terraform configuration files.',
        expectedCommand: /^terraform\s+init$/i,
        hint: 'Run `terraform init`',
        successMessage: 'Initializing the backend...\n\nInitializing provider plugins...\n- Finding latest version of hashicorp/azurerm...\n- Installing hashicorp/azurerm v3.0.0...\n\nTerraform has been successfully initialized!',
      },
      {
        id: 'tf-plan',
        objective: 'Create an execution plan to see what Terraform will do without actually applying changes.',
        expectedCommand: /^terraform\s+plan$/i,
        hint: 'Run `terraform plan`',
        successMessage: 'Terraform used the selected providers to generate the following execution plan.\n\n  + resource "azurerm_resource_group" "example" {\n      + id       = (known after apply)\n      + location = "eastus"\n      + name     = "TF-Lab-RG"\n    }\n\nPlan: 1 to add, 0 to change, 0 to destroy.',
      },
      {
        id: 'tf-apply',
        objective: 'Apply the changes required to reach the desired state of the configuration.',
        expectedCommand: /^terraform\s+apply(\s+-auto-approve)?$/i,
        hint: 'Run `terraform apply` or `terraform apply -auto-approve`',
        successMessage: 'azurerm_resource_group.example: Creating...\nazurerm_resource_group.example: Creation complete after 3s [id=/subscriptions/.../resourceGroups/TF-Lab-RG]\n\nApply complete! Resources: 1 added, 0 changed, 0 destroyed.',
      }
    ]
  },
  'azcli-201': {
    id: 'azcli-201',
    title: 'Azure CLI: Virtual Machines & Security',
    description: 'Deploy a Virtual Machine and secure it with a Network Security Group (NSG) using Azure CLI.',
    category: 'AzureCLI',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'az-nsg-create',
        objective: 'Create a Network Security Group named "Web-NSG" in "CLI-Lab-RG".',
        expectedCommand: /^az\s+network\s+nsg\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--name|-n)\s+Web-NSG.*$/i,
        hint: 'az network nsg create -g CLI-Lab-RG -n Web-NSG',
        successMessage: 'Network Security Group "Web-NSG" created successfully.',
      },
      {
        id: 'az-nsg-rule-create',
        objective: 'Add an inbound security rule to "Web-NSG" to allow port 80 (HTTP). Name the rule "Allow-HTTP".',
        expectedCommand: /^az\s+network\s+nsg\s+rule\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--nsg-name)\s+Web-NSG.*(--name|-n)\s+Allow-HTTP.*(--priority)\s+\d+.*(--destination-port-ranges)\s+80.*$/i,
        hint: 'az network nsg rule create -g CLI-Lab-RG --nsg-name Web-NSG -n Allow-HTTP --priority 100 --destination-port-ranges 80',
        successMessage: 'Security Rule "Allow-HTTP" added to Web-NSG.',
      },
      {
        id: 'az-vm-create',
        objective: 'Create an Ubuntu LTS Virtual Machine named "Web-VM" in "CLI-Lab-RG".',
        expectedCommand: /^az\s+vm\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--name|-n)\s+Web-VM.*(--image)\s+Ubuntu2204.*$/i,
        hint: 'az vm create -g CLI-Lab-RG -n Web-VM --image Ubuntu2204 --admin-username azureuser --generate-ssh-keys',
        successMessage: 'Virtual Machine "Web-VM" provisioned successfully. (Simulated)',
      }
    ]
  },
  'bicep-101': {
    id: 'bicep-101',
    title: 'Infrastructure as Code: Bicep',
    description: 'Learn how to deploy Azure resources declaratively using Bicep templates.',
    category: 'Bicep',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'bicep-build',
        objective: 'Compile your main.bicep file into an ARM template (main.json) to see what it generates under the hood.',
        expectedCommand: /^az\s+bicep\s+build.*(--file|-f)\s+main\.bicep.*$/i,
        hint: 'az bicep build --file main.bicep',
        successMessage: 'File main.json created successfully. (Simulated)',
      },
      {
        id: 'bicep-deploy-whatif',
        objective: 'Run a what-if deployment to preview the changes before actually deploying the Bicep file.',
        expectedCommand: /^az\s+deployment\s+group\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--template-file|-f)\s+main\.bicep.*(--what-if|-c)$/i,
        hint: 'az deployment group create -g CLI-Lab-RG -f main.bicep --what-if',
        successMessage: 'Resource and property changes are indicated with these symbols:\n  + Create\n\nThe deployment will update the following scope:\n\n  + Microsoft.Network/virtualNetworks/vnet-bicep\n  + Microsoft.Storage/storageAccounts/stbiceplab\n\nResource changes: 2 to create.',
      },
      {
        id: 'bicep-deploy',
        objective: 'Deploy the Bicep template to the resource group.',
        expectedCommand: /^az\s+deployment\s+group\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--template-file|-f)\s+main\.bicep.*$/i,
        hint: 'az deployment group create -g CLI-Lab-RG -f main.bicep',
        successMessage: 'Deployment successful. (Simulated resources created)',
      }
    ]
  },
  'powershell-101': {
    id: 'powershell-101',
    title: 'Azure PowerShell Basics',
    description: 'Learn the PowerShell equivalents for managing Azure resources using the Az module.',
    category: 'PowerShell',
    difficulty: 'Beginner',
    steps: [
      {
        id: 'ps-rg-create',
        objective: 'Create a resource group named "PS-Lab-RG" in "westus".',
        expectedCommand: /^New-AzResourceGroup.*-Name\s+PS-Lab-RG.*-Location\s+westus.*$/i,
        hint: 'New-AzResourceGroup -Name PS-Lab-RG -Location westus',
        successMessage: 'ResourceGroupName : PS-Lab-RG\nLocation          : westus\nProvisioningState : Succeeded\nTags              :\nResourceId        : /subscriptions/.../resourceGroups/PS-Lab-RG',
      },
      {
        id: 'ps-vnet-create',
        objective: 'Create a Virtual Network named "PS-VNet" in "PS-Lab-RG" with address prefix 192.168.0.0/16.',
        expectedCommand: /^New-AzVirtualNetwork.*-ResourceGroupName\s+PS-Lab-RG.*-Name\s+PS-VNet.*-AddressPrefix\s+192\.168\.0\.0\/16.*$/i,
        hint: 'New-AzVirtualNetwork -ResourceGroupName PS-Lab-RG -Name PS-VNet -AddressPrefix 192.168.0.0/16',
        successMessage: 'Name              : PS-VNet\nResourceGroupName : PS-Lab-RG\nLocation          : westus\nProvisioningState : Succeeded\nAddressSpace      :\n  AddressPrefixes : [ 192.168.0.0/16 ]',
      }
    ]
  },
  'kubectl-101': {
    id: 'kubectl-101',
    title: 'AKS: Kubernetes Basics',
    description: 'Learn the essential kubectl commands to interact with your Azure Kubernetes Service (AKS) clusters.',
    category: 'Kubectl',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'aks-get-credentials',
        objective: 'First, retrieve the access credentials for your AKS cluster named "MyAKSCluster" in the "Kube-RG" resource group.',
        expectedCommand: /^az\s+aks\s+get-credentials.*(--resource-group|-g)\s+Kube-RG.*(--name|-n)\s+MyAKSCluster.*$/i,
        hint: 'az aks get-credentials -g Kube-RG -n MyAKSCluster',
        successMessage: 'Merged "MyAKSCluster" as current context in /home/azureuser/.kube/config',
      },
      {
        id: 'k8s-get-nodes',
        objective: 'List all the nodes in your Kubernetes cluster to ensure they are ready.',
        expectedCommand: /^kubectl\s+get\s+nodes.*$/i,
        hint: 'kubectl get nodes',
        successMessage: 'NAME                                STATUS   ROLES   AGE   VERSION\naks-agentpool-12345678-vmss000000   Ready    agent   12m   v1.28.5\naks-agentpool-12345678-vmss000001   Ready    agent   12m   v1.28.5',
      },
      {
        id: 'k8s-deploy',
        objective: 'Deploy a simple NGINX image to your cluster by creating a deployment named "nginx-app".',
        expectedCommand: /^kubectl\s+create\s+deployment\s+nginx-app\s+--image=nginx.*$/i,
        hint: 'kubectl create deployment nginx-app --image=nginx',
        successMessage: 'deployment.apps/nginx-app created',
      },
      {
        id: 'k8s-get-pods',
        objective: 'Verify your deployment by listing all the pods in the default namespace.',
        expectedCommand: /^kubectl\s+get\s+pods.*$/i,
        hint: 'kubectl get pods',
        successMessage: 'NAME                         READY   STATUS    RESTARTS   AGE\nnginx-app-7f456874f4-5xjqp   1/1     Running   0          45s\n\nQuest Complete! You just deployed your first app to AKS!',
      }
    ]
  },
  'azcli-301': {
    id: 'azcli-301',
    title: 'Azure CLI: Expert Hub-and-Spoke Networking',
    description: 'Deploy a complex Hub-and-Spoke network topology with VNet Peering and a central Azure Firewall.',
    category: 'AzureCLI',
    difficulty: 'Expert',
    steps: [
      {
        id: 'az-vnet-hub',
        objective: 'Create the Hub Virtual Network named "Hub-VNet" in "CLI-Lab-RG" with the prefix 10.0.0.0/16.',
        expectedCommand: /^az\s+network\s+vnet\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--name|-n)\s+Hub-VNet.*(--address-prefixes?)\s+10\.0\.0\.0\/16.*$/i,
        hint: 'az network vnet create -g CLI-Lab-RG -n Hub-VNet --address-prefix 10.0.0.0/16',
        successMessage: 'Hub-VNet created.',
      },
      {
        id: 'az-vnet-spoke',
        objective: 'Create a Spoke Virtual Network named "Spoke1-VNet" with the prefix 10.1.0.0/16.',
        expectedCommand: /^az\s+network\s+vnet\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--name|-n)\s+Spoke1-VNet.*(--address-prefixes?)\s+10\.1\.0\.0\/16.*$/i,
        hint: 'az network vnet create -g CLI-Lab-RG -n Spoke1-VNet --address-prefix 10.1.0.0/16',
        successMessage: 'Spoke1-VNet created.',
      },
      {
        id: 'az-vnet-peering',
        objective: 'Peer the Hub to the Spoke. Name the peering "Hub-to-Spoke1". You will need to reference the Spoke1-VNet.',
        expectedCommand: /^az\s+network\s+vnet\s+peering\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--name|-n)\s+Hub-to-Spoke1.*(--vnet-name)\s+Hub-VNet.*(--remote-vnet)\s+Spoke1-VNet.*(--allow-vnet-access).*$/i,
        hint: 'az network vnet peering create -g CLI-Lab-RG -n Hub-to-Spoke1 --vnet-name Hub-VNet --remote-vnet Spoke1-VNet --allow-vnet-access',
        successMessage: 'Peering "Hub-to-Spoke1" established. (Note: A reciprocal peering from Spoke to Hub is also required in practice).',
      },
      {
        id: 'az-firewall-subnet',
        objective: 'Create a subnet in the Hub VNet strictly named "AzureFirewallSubnet" with prefix 10.0.1.0/26.',
        expectedCommand: /^az\s+network\s+vnet\s+subnet\s+create.*(--resource-group|-g)\s+CLI-Lab-RG.*(--vnet-name)\s+Hub-VNet.*(--name|-n)\s+AzureFirewallSubnet.*(--address-prefixes?)\s+10\.0\.1\.0\/26.*$/i,
        hint: 'az network vnet subnet create -g CLI-Lab-RG --vnet-name Hub-VNet -n AzureFirewallSubnet --address-prefixes 10.0.1.0/26',
        successMessage: 'AzureFirewallSubnet created successfully.',
      }
    ]
  },
  'terraform-301': {
    id: 'terraform-301',
    title: 'IaC: Advanced Terraform State Management',
    description: 'Master advanced Terraform concepts: workspaces, state manipulation, and importing existing resources.',
    category: 'Terraform',
    difficulty: 'Expert',
    steps: [
      {
        id: 'tf-workspace-new',
        objective: 'Create and switch to a new Terraform workspace named "production".',
        expectedCommand: /^terraform\s+workspace\s+new\s+production.*$/i,
        hint: 'terraform workspace new production',
        successMessage: 'Created and switched to workspace "production"!',
      },
      {
        id: 'tf-import',
        objective: 'Import an existing Azure Resource Group (ID: /subscriptions/.../resourceGroups/Legacy-RG) into your Terraform state under the address "azurerm_resource_group.legacy".',
        expectedCommand: /^terraform\s+import\s+azurerm_resource_group\.legacy\s+\/subscriptions\/.*\/resourceGroups\/Legacy-RG.*$/i,
        hint: 'terraform import azurerm_resource_group.legacy /subscriptions/.../resourceGroups/Legacy-RG',
        successMessage: 'azurerm_resource_group.legacy: Importing from ID "/subscriptions/.../resourceGroups/Legacy-RG"...\nImport successful!',
      },
      {
        id: 'tf-state-rm',
        objective: 'You want to stop managing a resource named "azurerm_storage_account.temp" without destroying it in Azure. Remove it from the Terraform state.',
        expectedCommand: /^terraform\s+state\s+rm\s+azurerm_storage_account\.temp.*$/i,
        hint: 'terraform state rm azurerm_storage_account.temp',
        successMessage: 'Removed azurerm_storage_account.temp\nSuccessfully removed 1 resource instance(s).',
      }
    ]
  },
  'linux-201': {
    id: 'linux-201',
    title: 'Linux: Piping and Searching',
    description: 'Learn how to chain commands together and search inside files using grep and pipes.',
    category: 'Bash',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'linux-echo-redirect',
        objective: 'Write the text "Hello World" into a file named "greeting.txt" using the echo command and a redirect (>).',
        expectedCommand: /^echo\s+"?Hello\s+World"?\s+>\s+greeting\.txt$/i,
        hint: 'echo "Hello World" > greeting.txt',
        successMessage: '(Simulated) Wrote to greeting.txt',
      },
      {
        id: 'linux-cat-grep',
        objective: 'Read the contents of "greeting.txt" using cat, and pipe (|) the output into grep to search for the word "World".',
        expectedCommand: /^cat\s+greeting\.txt\s+\|\s+grep\s+"?World"?$/i,
        hint: 'cat greeting.txt | grep World',
        successMessage: 'Hello World\n(Simulated) Command executed successfully.',
      }
    ]
  },
  'azcli-102': {
    id: 'azcli-102',
    title: 'Azure CLI: Storage Accounts',
    description: 'Learn how to create a Storage Account and interact with Blob containers.',
    category: 'AzureCLI',
    difficulty: 'Beginner',
    steps: [
      {
        id: 'az-storage-create',
        objective: 'Create a storage account named "mystorageacct123" in the "CLI-Lab-RG" resource group with Standard_LRS SKU.',
        expectedCommand: /^az\s+storage\s+account\s+create.*(-g|--resource-group)\s+CLI-Lab-RG.*(-n|--name)\s+mystorageacct123.*(--sku)\s+Standard_LRS.*$/i,
        hint: 'az storage account create -n mystorageacct123 -g CLI-Lab-RG --sku Standard_LRS',
        successMessage: '(Simulated) Storage account mystorageacct123 created.',
      },
      {
        id: 'az-storage-container-create',
        objective: 'Create a blob container named "mycontainer" inside your new storage account.',
        expectedCommand: /^az\s+storage\s+container\s+create.*(-n|--name)\s+mycontainer.*(--account-name)\s+mystorageacct123.*$/i,
        hint: 'az storage container create -n mycontainer --account-name mystorageacct123',
        successMessage: '(Simulated) Container mycontainer created.',
      }
    ]
  },
  'terraform-102': {
    id: 'terraform-102',
    title: 'Terraform: Outputs and Variables',
    description: 'Practice retrieving data from state using outputs and passing variable definitions inline.',
    category: 'Terraform',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'tf-output',
        objective: 'Retrieve all the output values from the current Terraform state.',
        expectedCommand: /^terraform\s+output$/i,
        hint: 'terraform output',
        successMessage: 'vnet_id = "/subscriptions/.../virtualNetworks/MyVNet"\nvm_public_ip = "203.0.113.5"',
      },
      {
        id: 'tf-apply-var',
        objective: 'Run a terraform apply, but pass the variable "environment" with the value "staging" inline via the command line.',
        expectedCommand: /^terraform\s+apply.*-var(\s+|=)"?environment=staging"?.*$/i,
        hint: 'terraform apply -var="environment=staging"',
        successMessage: 'Apply complete! Resources: 1 added, 0 changed, 0 destroyed.',
      }
    ]
  },
  'powershell-201': {
    id: 'powershell-201',
    title: 'PowerShell: Filtering and Objects',
    description: 'Learn how to fetch Azure resources and filter them using PowerShell Where-Object.',
    category: 'PowerShell',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'ps-get-vm',
        objective: 'Get all Virtual Machines in the subscription.',
        expectedCommand: /^Get-AzVM$/i,
        hint: 'Get-AzVM',
        successMessage: 'ResourceGroupName          Name      Location          VmSize  OsType            ProvisioningState\n-----------------          ----      --------          ------  ------            -----------------\nCLI-Lab-RG                 Web-VM    eastus    Standard_DS1_v2   Linux                    Succeeded',
      },
      {
        id: 'ps-where-object',
        objective: 'Pipe Get-AzVM into Where-Object to only find VMs where the Location is "eastus".',
        expectedCommand: /^Get-AzVM\s+\|\s+Where-Object\s+\{?\s*\$_\.Location\s+-eq\s+['"]eastus['"]\s*\}?$/i,
        hint: "Get-AzVM | Where-Object { $_.Location -eq 'eastus' }",
        successMessage: '(Simulated) Output filtered to eastus VMs.',
      }
    ]
  }
};
