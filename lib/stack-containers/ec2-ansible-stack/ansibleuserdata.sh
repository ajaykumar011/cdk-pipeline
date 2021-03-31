#!/bin/bash
set -x

python_version=3.8
#pywinrm_version=0.4
ansible_version=2.9
alias=true

# cd /tmp
# yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
# systemctl enable amazon-ssm-agent
# systemctl start amazon-ssm-agent

# yum install -y python${python_version}-pip tree git
amazon-linux-extras install python${python_version} ansible${ansible_version} -y

rm -rf /usr/local/aws
rm /usr/local/bin/aws

#python${python_version} -m pip install ansible==${ansible_version} pywinrm boto3
python${python_version} -m pip install pywinrm boto3
# pip install pywinrm boto3
# pip install pywinrm==0.4 boto3

aws --version
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
which aws

ls -l /usr/local/bin/aws
aws --version
# ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update


ansible-galaxy collection install amazon.aws
ansible localhost -a "which python3"
# ansible-playbook pb.yml --extra-vars "ansible_python_interpreter=/usr/bin/python3"

# export AWS_DEFAULT_REGION=us-east-1
# git config --global credential.helper '!aws codecommit credential-helper $@'
# git config --global credential.UseHttpPath true

mkdir -p ansible2/group_vars
cat > ansible2/group_vars/win <<EOL
---
ansible_user: developer
ansible_password: myP@ssworD1
ansible_connection: winrm
ansible_winrm_server_cert_validation: ignore
ansible_python_interpreter: /usr/bin/python
EOL

cd ansible2

cat > ansible2/master-playbook.json <<EOL
[
  {
    "name": "a play that runs entirely on the ansible host",
    "hosts": "127.0.0.1",
    "connection": "local",
    "tasks": [
      {
        "name": "check out a git repository",
        "git": "repo=https://git-codecommit.us-east-1.amazonaws.com/v1/repos/mycode-repo dest=./playbooks-store force=true"
      },
      {
        "ec2_instance_info": {
          "region": "us-east-1",
          "filters": {
            "tag:Name": "WinInstance1",
            "instance-state-name": [
              "running"
            ]
          }
        },
        "register": "info"
      },
      {
        "debug": "var=info['instances'][0]['public_ip_address']"
      },
      {
        "debug": "var=info['instances']|length"
      },
      {
        "local_action": {
          "module": "copy",
          "content": "[win] {%- for h in range(0, info['instances']|length) -%}\n  {{''.encode('string_escape')}}\n  {{ info['instances'][h]['public_ip_address'] }}\n{%- endfor -%}\n",
          "dest": "./hosts"
        }
      }
    ]
  },
  {
    "import_playbook": "win_target_preps.yml"
  }
]
EOL


cat > ansible2/win_target_preps.json <<EOL
[
  {
    "name": "Install via AWS CLI on Windows Targets",
    "hosts": "win",
    "gather_facts": false,
    "tasks": [
      {
        "name": "Run multi-lined shell commands to Install AWS CLI",
        "win_shell": "$dlurl = \"https://s3.amazonaws.com/aws-cli/AWSCLI64PY3.msi\"\n$installerPath = Join-Path $env:TEMP (Split-Path $dlurl -Leaf)\nInvoke-WebRequest $dlurl -OutFile $installerPath\nStart-Process -FilePath msiexec -Args \"/i $installerPath /passive\" -Verb RunAs -Wait\nRemove-Item $installerPath\n"
      },
      {
        "name": "Save the result of 'AWS Version' in 'aws_ver'",
        "win_command": "aws --version",
        "register": "aws_ver"
      },
      {
        "debug": "msg={{ aws_ver.stdout }}"
      }
    ]
  },
  {
    "import_playbook": "playbooks-store/install-7z-iis.yml"
  }
]
EOL


# touch $FILE_NAME

# echo """I wrote all
# the
# stuff
# here.
# And to access a variable we can use
# $FILE_NAME

# """ >> $FILE_NAME


