#include<iostream>
using namespace std;

float convert(float f){
    cout<<f*1.8+32;
};

main(){
    float cDegree=0,fDegree=0;
    cout<<"Please enter a Celsius value:";
    cin>>cDegree;
    fDegree=convert(cDegree);
    cout<<fDegree<<endl;
    cout<<cDegree;
    return 0;
}
