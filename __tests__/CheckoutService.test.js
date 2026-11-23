import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

describe('CheckoutService', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // CENÁRIO 1: Pagamento recusado
    test('deve retornar null e não salvar pedido nem enviar e-mail quando o pagamento falhar', async () => {

        // Arrange
        const carrinho = new CarrinhoBuilder().build();

        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({
                success: false
            })
        };

        const repositoryMock = {
            salvar: jest.fn()
        };

        const emailMock = {
            enviarEmail: jest.fn()
        };

        const checkoutService = new CheckoutService(
            gatewayStub,
            repositoryMock,
            emailMock
        );

        // Act
        const pedido = await checkoutService.processarPedido(
            carrinho,
            '123456'
        );

        // Assert
        expect(pedido).toBeNull();

        expect(gatewayStub.cobrar).toHaveBeenCalledWith(
            100,
            '123456'
        );

        expect(repositoryMock.salvar).not.toHaveBeenCalled();

        expect(emailMock.enviarEmail).not.toHaveBeenCalled();
    });

    // CENÁRIO 2: Cliente padrão
    test('deve retornar o pedido salvo com o valor integral para cliente padrão', async () => {

        // Arrange
        const carrinho = new CarrinhoBuilder().build();

        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({
                success: true
            })
        };

        const pedidoSalvo = new Pedido(
            789,
            carrinho,
            100,
            'PROCESSADO'
        );

        const repositoryStub = {
            salvar: jest.fn().mockResolvedValue(pedidoSalvo)
        };

        const emailMock = {
            enviarEmail: jest.fn().mockResolvedValue(undefined)
        };

        const checkoutService = new CheckoutService(
            gatewayStub,
            repositoryStub,
            emailMock
        );

        // Act
        const pedido = await checkoutService.processarPedido(
            carrinho,
            '123456'
        );

        // Assert
        expect(pedido).toBe(pedidoSalvo);
        expect(pedido.totalFinal).toBe(100);

        expect(gatewayStub.cobrar).toHaveBeenCalledWith(
            100,
            '123456'
        );

        expect(repositoryStub.salvar).toHaveBeenCalledTimes(1);
    });

    // CENÁRIO 3: Cliente Premium
    test('deve aplicar 10% de desconto para cliente Premium e enviar e-mail corretamente', async () => {

        // Arrange
        const usuario = UserMother.umUsuarioPremium();

        const carrinho = new CarrinhoBuilder()
            .comUser(usuario)
            .comItens([
                new Item('Produto 1', 100),
                new Item('Produto 2', 100)
            ])
            .build();

        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({
                success: true
            })
        };

        const pedidoSalvo = new Pedido(
            123,
            carrinho,
            180,
            'PROCESSADO'
        );

        const repositoryStub = {
            salvar: jest.fn().mockResolvedValue(pedidoSalvo)
        };

        const emailMock = {
            enviarEmail: jest.fn().mockResolvedValue(undefined)
        };

        const checkoutService = new CheckoutService(
            gatewayStub,
            repositoryStub,
            emailMock
        );

        // Act
        const pedido = await checkoutService.processarPedido(
            carrinho,
            '123456'
        );

        // Assert
        expect(pedido).toBe(pedidoSalvo);
        expect(pedido.totalFinal).toBe(180);

        expect(gatewayStub.cobrar).toHaveBeenCalledWith(
            180,
            '123456'
        );

        expect(repositoryStub.salvar).toHaveBeenCalledTimes(1);

        expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);

        expect(emailMock.enviarEmail).toHaveBeenCalledWith(
            'premium@email.com',
            'Seu Pedido foi Aprovado!',
            'Pedido 123 no valor de R$180'
        );
    });

    // CENÁRIO 4: Falha no envio do e-mail
    test('deve retornar o pedido mesmo quando o envio do e-mail falhar', async () => {

        // Arrange
        const carrinho = new CarrinhoBuilder().build();

        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({
                success: true
            })
        };

        const pedidoSalvo = new Pedido(
            456,
            carrinho,
            100,
            'PROCESSADO'
        );

        const repositoryStub = {
            salvar: jest.fn().mockResolvedValue(pedidoSalvo)
        };

        const emailMock = {
            enviarEmail: jest.fn().mockRejectedValue(
                new Error('Falha no envio do e-mail')
            )
        };

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const checkoutService = new CheckoutService(
            gatewayStub,
            repositoryStub,
            emailMock
        );

        // Act
        const pedido = await checkoutService.processarPedido(
            carrinho,
            '123456'
        );

        // Assert
        expect(pedido).toBe(pedidoSalvo);
        expect(repositoryStub.salvar).toHaveBeenCalledTimes(1);
        expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

});